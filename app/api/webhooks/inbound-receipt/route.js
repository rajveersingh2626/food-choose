import { NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { ai } from '@/lib/gemini';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Inbound WhatsApp / Push Webhook for Zero-Friction Pantry Ingestion
 * When a user forwards or sends a cart screenshot to the WhatsApp bot:
 * 1. Twilio sends a POST request with `MediaUrl0` and `From`.
 * 2. Matches user profile by phone number.
 * 3. Downloads image buffer and runs Gemini Vision extraction.
 * 4. Inserts items into `pantry_items`.
 * 5. Replies via WhatsApp with a clean inventory confirmation and expiration heads-up.
 */
export async function POST(req) {
  try {
    const formData = await req.formData();
    const fromPhone = formData.get('From') || ''; // e.g. "whatsapp:+919876543210"
    const mediaUrl = formData.get('MediaUrl0');
    const incomingText = formData.get('Body') || '';

    const cleanPhone = fromPhone.replace(/^whatsapp:\+?/, '').replace(/\D/g, '');

    const adminClient = createAdminSupabaseClient();

    // 1. Identify user and household by phone number
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, full_name, household_id, city')
      .ilike('phone_number', `%${cleanPhone.slice(-10)}%`)
      .limit(1)
      .single();

    if (!profile?.household_id) {
      // Unlinked phone number prompt
      return respondTwilioXml(
        `Welcome to your Kitchen Companion! Your phone number is not yet linked. Log in to your app account and add ${cleanPhone} in your profile settings.`
      );
    }

    if (!mediaUrl) {
      // Text fallback
      return respondTwilioXml(
        `Hi ${profile.full_name || 'Chef'}! Send a screenshot of your Blinkit, Zepto, or Instamart cart/invoice and I'll automatically log your pantry items.`
      );
    }

    // 2. Fetch the image from Twilio media URL
    const imgResponse = await fetch(mediaUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
      }
    });

    const buffer = Buffer.from(await imgResponse.arrayBuffer());
    const base64Data = buffer.toString('base64');
    const mimeType = imgResponse.headers.get('content-type') || 'image/jpeg';

    // 3. Extract items using Gemini Vision
    const visionPrompt = `
Analyze this screenshot of a grocery delivery cart or receipt (e.g. Blinkit, Zepto, Swiggy Instamart).
Extract all purchased grocery items with:
- item_name: Clean, standardized grocery name.
- brand: Brand if visible.
- quantity: Numeric amount purchased.
- unit: "units", "g", "kg", "ml", "L", or "pack".
- category: Exactly "perishable" or "staple".
- estimated_shelf_life_days: Standard shelf-life in days (fresh herbs: 3, dairy/avocado: 4-7, bakery: 4, pantry staples: 180).

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
      return respondTwilioXml('Could not identify grocery items in this image. Please send a clearer screenshot of the cart.');
    }

    // 4. Batch insert into pantry_items
    const now = new Date();
    const rowsToInsert = items.map((item) => {
      const isPerishable = item.category?.toLowerCase() === 'perishable';
      const shelfDays = Number(item.estimated_shelf_life_days) || (isPerishable ? 4 : 180);
      const expiresAt = new Date(now.getTime() + shelfDays * 24 * 60 * 60 * 1000);

      return {
        household_id: profile.household_id,
        created_by: profile.id,
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

    await adminClient.from('pantry_items').insert(rowsToInsert);

    // 5. Clean WhatsApp confirmation message (no emojis)
    const itemSummary = rowsToInsert.map(i => `${i.item_name} (${i.quantity} ${i.unit})`).join(', ');
    const replyMessage = `Added ${rowsToInsert.length} items to your kitchen pantry: ${itemSummary}. Your pantry and meal plans have been updated automatically!`;

    return respondTwilioXml(replyMessage);
  } catch (error) {
    console.error('Inbound WhatsApp Webhook Error:', error);
    return respondTwilioXml('Sorry, there was an issue processing your receipt image. Please try again.');
  }
}

function respondTwilioXml(messageText) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${messageText}</Message></Response>`;
  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' }
  });
}
