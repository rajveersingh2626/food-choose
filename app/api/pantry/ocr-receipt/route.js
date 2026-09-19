import { NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { ai } from '@/lib/gemini';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const supabase = createServerSupabaseClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('household_id, subscription_tier, monthly_ocr_usage')
      .eq('id', user.id)
      .single();

    if (profError || !profile?.household_id) {
      return NextResponse.json({ error: 'User does not belong to an active household' }, { status: 400 });
    }

    // Public SaaS monthly receipt scan limit
    if (profile.subscription_tier === 'free' && profile.monthly_ocr_usage >= 25) {
      return NextResponse.json(
        { error: 'Monthly receipt scan limit reached (25 scans/mo). Upgrade to Pro for unlimited receipt parsing.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('receipt_image');
    if (!file) {
      return NextResponse.json({ error: 'No receipt image provided in multipart form data' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const visionPrompt = `
Analyze this screenshot of a grocery delivery cart or receipt (e.g., Blinkit, Zepto, Swiggy Instamart, BigBasket, Whole Foods).
Extract all purchased grocery/pantry items. For each item:
1. item_name: Clean, standardized grocery name (e.g., "Greek Yogurt", "Hass Avocado", "Whole Milk", "Baby Spinach").
2. brand: Brand name if mentioned (e.g., "Epigamia", "Amul", "Blue Tokai", "Country Delight", "Subko").
3. quantity: Numeric amount purchased (e.g. 1, 2, 500).
4. unit: "units", "g", "kg", "ml", "L", or "pack".
5. category: Exactly "perishable" (fresh herbs, greens, vegetables, fruits, dairy, bakery, meat, refrigerated dips) or "staple" (cooking oils, grains, flour, spices, pasta, canned goods, sauces).
6. estimated_shelf_life_days: Standard shelf-life (e.g. fresh coriander/spinach: 3, avocado/berries: 4, milk: 3, yogurt: 7, sourdough bread: 4, pasta/rice: 180).

Return strictly structured JSON matching the schema.`;

    const visionResponse = await ai.models.generateContent({
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
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item_name: { type: Type.STRING },
                  brand: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  category: { type: Type.STRING },
                  estimated_shelf_life_days: { type: Type.INTEGER }
                },
                required: ['item_name', 'quantity', 'unit', 'category', 'estimated_shelf_life_days']
              }
            }
          },
          required: ['items']
        }
      }
    });

    const { items } = JSON.parse(visionResponse.text);

    if (!items || items.length === 0) {
      return NextResponse.json({ success: true, extracted_count: 0, items: [] });
    }

    // Compute expiration dates and map to Supabase rows
    const now = new Date();
    const rowsToInsert = items.map((item) => {
      const isPerishable = item.category?.toLowerCase() === 'perishable';
      const shelfDays = Number(item.estimated_shelf_life_days) || (isPerishable ? 4 : 180);
      const expiresAt = new Date(now.getTime() + shelfDays * 24 * 60 * 60 * 1000);

      return {
        household_id: profile.household_id,
        created_by: user.id,
        item_name: item.item_name.trim(),
        brand: item.brand?.trim() || null,
        category: isPerishable ? 'perishable' : 'staple',
        quantity: Number(item.quantity) || 1.0,
        unit: item.unit || 'units',
        added_at: now.toISOString(),
        expires_at: isPerishable ? expiresAt.toISOString() : null,
        is_active: true,
        source: 'ocr_receipt'
      };
    });

    const { data: inserted, error: dbError } = await supabase
      .from('pantry_items')
      .insert(rowsToInsert)
      .select();

    if (dbError) throw dbError;

    // Increment user's monthly OCR counter
    await supabase
      .from('profiles')
      .update({ monthly_ocr_usage: (profile.monthly_ocr_usage || 0) + 1 })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      extracted_count: inserted.length,
      items: inserted
    });
  } catch (error) {
    console.error('Receipt OCR Parser Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
