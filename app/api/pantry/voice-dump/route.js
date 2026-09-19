import { NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { ai } from '@/lib/gemini';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { calculateDynamicExpiration } from '@/lib/perishabilityEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Module 1 - Feature A: The Voice Dump
 * Accepts raw audio file or voice transcript string.
 * Example voice input: "I just bought 2 avocados, oat milk, sourdough bread, and fresh coriander"
 * Uses Gemini to extract structured grocery items, determines storage methods, calculates dynamic shelf life,
 * and inserts them directly into Supabase pantry_items.
 */
export async function POST(req) {
  try {
    const supabase = createServerSupabaseClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.household_id) {
      return NextResponse.json({ error: 'User does not belong to a household.' }, { status: 400 });
    }

    const contentType = req.headers.get('content-type') || '';
    let transcriptText = '';
    let audioPart = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const audioFile = formData.get('audio');
      const textInput = formData.get('transcript');

      if (textInput && typeof textInput === 'string' && textInput.trim()) {
        transcriptText = textInput.trim();
      } else if (audioFile && typeof audioFile === 'object' && audioFile.arrayBuffer) {
        const buffer = Buffer.from(await audioFile.arrayBuffer());
        const base64Audio = buffer.toString('base64');
        const mimeType = audioFile.type || 'audio/webm';
        audioPart = { inlineData: { mimeType, data: base64Audio } };
      }
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      transcriptText = body.transcript || '';
    }

    if (!transcriptText && !audioPart) {
      return NextResponse.json(
        { error: 'Missing audio recording or speech transcript.' },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are the zero-typing pantry intake assistant for a modern kitchen.
Your task is to parse spoken voice grocery dumps (e.g., "I just bought two avocados, a pack of sourdough, milk, and coriander from the market").

Extract all grocery items. For each item:
1. item_name: Standard clean culinary ingredient name.
2. brand: Brand name if mentioned, otherwise null.
3. quantity: Numeric amount (e.g. 2, 1, 500). Default to 1 if unspecified.
4. unit: "units", "g", "kg", "ml", "L", "slices", "pack", or "bunch".
5. suggested_storage: Standard storage method: exactly "fridge", "counter", or "freezer".
6. needs_storage_clarification: boolean. True if the item is commonly stored in different ways with vastly different shelf lives (e.g. avocados: counter to ripen vs fridge to preserve; bread: counter vs fridge vs freezer).

Return strict JSON matching the schema.`;

    const contents = audioPart
      ? [audioPart, { text: systemPrompt }]
      : [{ text: `${systemPrompt}\n\nSpoken transcript: "${transcriptText}"` }];

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extracted_items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item_name: { type: Type.STRING },
                  brand: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  suggested_storage: { type: Type.STRING },
                  needs_storage_clarification: { type: Type.BOOLEAN }
                },
                required: ['item_name', 'quantity', 'unit', 'suggested_storage', 'needs_storage_clarification']
              }
            }
          },
          required: ['extracted_items']
        }
      }
    });

    const { extracted_items } = JSON.parse(geminiRes.text);

    if (!extracted_items || extracted_items.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No grocery items detected in voice dump.',
        items: []
      });
    }

    // Process each item through the dynamic perishability engine
    const now = new Date();
    const rowsToInsert = [];
    const itemsNeedingClarification = [];

    for (const item of extracted_items) {
      const storage = ['fridge', 'freezer', 'counter'].includes(item.suggested_storage)
        ? item.suggested_storage
        : 'fridge';

      const perishability = await calculateDynamicExpiration(item.item_name, storage, now);

      const dbRow = {
        household_id: profile.household_id,
        created_by: user.id,
        item_name: item.item_name.trim(),
        brand: item.brand?.trim() || null,
        category: perishability.category,
        storage_method: storage,
        quantity: Number(item.quantity) || 1.0,
        unit: item.unit || 'units',
        added_at: now.toISOString(),
        expires_at: perishability.expiresAt,
        is_active: true,
        source: 'voice_dump'
      };

      rowsToInsert.push(dbRow);

      if (item.needs_storage_clarification || perishability.isAmbiguous) {
        itemsNeedingClarification.push({
          name: item.item_name,
          current_storage: storage,
          shelf_life_days: perishability.shelfLifeDays
        });
      }
    }

    const { data: inserted, error: dbError } = await supabase
      .from('pantry_items')
      .insert(rowsToInsert)
      .select();

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      count: inserted.length,
      items: inserted,
      ambiguous_items: itemsNeedingClarification
    });
  } catch (error) {
    console.error('Voice Dump Intake Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
