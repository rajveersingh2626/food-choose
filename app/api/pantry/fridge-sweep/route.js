import { NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { ai } from '@/lib/gemini';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { calculateDynamicExpiration } from '@/lib/perishabilityEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Module 1 - Feature B: The Fridge Sweep
 * Accepts a wide-angle photo or short video of an open fridge, freezer, or pantry.
 * 
 * Vision Architecture:
 * - For images: Base64 buffer streamed directly to Gemini 2.5 Flash vision.
 * - For video clips (e.g. 5-10 second panoramic scan of fridge shelves):
 *   Gemini 2.5 Flash natively digests multi-frame video buffers, tracking items across panning angles
 *   to avoid duplicate detections across shelves and door compartments.
 * - Auto-populates Supabase pantry_items with item_name, quantity, storage_method, and dynamic expiration.
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
      return NextResponse.json({ error: 'User does not belong to an active household.' }, { status: 400 });
    }

    const formData = await req.formData();
    const mediaFile = formData.get('media') || formData.get('image') || formData.get('video');
    const sweepZone = formData.get('sweep_zone') || 'fridge'; // 'fridge' | 'freezer' | 'counter'

    if (!mediaFile || typeof mediaFile !== 'object') {
      return NextResponse.json(
        { error: 'No media file provided. Please upload a fridge photo or short sweep video.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await mediaFile.arrayBuffer());
    const base64Data = buffer.toString('base64');
    const mimeType = mediaFile.type || 'image/jpeg';
    const isVideo = mimeType.startsWith('video/');

    const visionPrompt = `
You are an expert computer vision model specializing in kitchen inventory detection from wide-angle photographs and video sweeps of open refrigerators, freezers, and pantries.
Sweep Zone Target: "${sweepZone}".

Scan all visible compartments (top shelf, middle shelf, crisper drawers, door condiment racks).
Detect and catalog all distinct consumable food, beverage, and produce items.

Directives:
1. Deduplication: If the camera pans across the same item multiple times in a video, report it once with its true aggregate count.
2. Identifiers: Detect common grocery brand labels if visible (e.g., "Amul", "Epigamia", "Oatly", "Chobani").
3. Quantity Estimation: Estimate numeric count or approximate fullness (e.g. 1 carton, 3 eggs, 2 bell peppers, 1 tub).
4. Shelf Life: Estimate remaining days based on visible freshness and storage zone (${sweepZone}).
5. Confidence: Rate your visual identification confidence from 0.0 to 1.0.

Return strict JSON matching the schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { inlineData: { mimeType, data: base64Data } },
        { text: visionPrompt }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detected_items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item_name: { type: Type.STRING },
                  brand: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  compartment: { type: Type.STRING }, // e.g. "top shelf", "door rack", "crisper"
                  confidence: { type: Type.NUMBER }
                },
                required: ['item_name', 'quantity', 'unit', 'compartment', 'confidence']
              }
            }
          },
          required: ['detected_items']
        }
      }
    });

    const { detected_items } = JSON.parse(response.text);

    if (!detected_items || detected_items.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No distinct ingredients could be identified in this sweep. Try ensuring good lighting.',
        items: []
      });
    }

    // Process detected items and calculate dynamic expiration
    const now = new Date();
    const rowsToInsert = [];

    for (const item of detected_items) {
      // Filter out low confidence detections
      if (item.confidence < 0.45) continue;

      const storageMethod = ['fridge', 'freezer', 'counter'].includes(sweepZone) ? sweepZone : 'fridge';
      const perishability = await calculateDynamicExpiration(item.item_name, storageMethod, now);

      rowsToInsert.push({
        household_id: profile.household_id,
        created_by: user.id,
        item_name: item.item_name.trim(),
        brand: item.brand?.trim() || null,
        category: perishability.category,
        storage_method: storageMethod,
        quantity: Number(item.quantity) || 1.0,
        unit: item.unit || 'units',
        added_at: now.toISOString(),
        expires_at: perishability.expiresAt,
        is_active: true,
        source: isVideo ? 'video_sweep' : 'photo_sweep'
      });
    }

    const { data: inserted, error: dbError } = await supabase
      .from('pantry_items')
      .insert(rowsToInsert)
      .select();

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      sweep_zone: sweepZone,
      media_type: isVideo ? 'video' : 'photo',
      detected_count: detected_items.length,
      inserted_count: inserted?.length || 0,
      items: inserted
    });
  } catch (error) {
    console.error('Fridge Sweep Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
