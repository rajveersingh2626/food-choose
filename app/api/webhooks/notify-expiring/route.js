import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook triggered when perishable items are approaching expiration (<48 hours).
 * Synthesizes an ultra-fast, aesthetic 15-minute "Fridge-Clearing" recipe using active inventory
 * and sends proactive push / WhatsApp / n8n notifications.
 */
export async function POST(req) {
  try {
    const admin = createAdminSupabaseClient();
    const { householdId, expiringItemIds } = await req.json();

    if (!householdId || !Array.isArray(expiringItemIds) || expiringItemIds.length === 0) {
      return NextResponse.json({ error: 'Missing householdId or expiringItemIds' }, { status: 400 });
    }

    // 1. Fetch expiring items, active pantry inventory, and household member profiles
    const [expiringRes, activePantryRes, membersRes] = await Promise.all([
      admin.from('pantry_items').select('id, item_name, quantity, unit, brand, expires_at').in('id', expiringItemIds),
      admin.from('pantry_items').select('item_name, quantity, unit, brand').eq('household_id', householdId).eq('is_active', true),
      admin.from('household_members').select('user_id, profiles(full_name, phone_number, city)').eq('household_id', householdId)
    ]);

    const expiring = expiringRes.data || [];
    const activePantry = activePantryRes.data || [];
    const members = membersRes.data || [];

    if (expiring.length === 0) {
      return NextResponse.json({ message: 'No expiring items found to alert.' });
    }

    const city = members[0]?.profiles?.city || 'your city';
    const expiringListStr = expiring.map(i => `${i.item_name} (${i.quantity} ${i.unit})`).join(', ');

    // 2. Synthesize Proactive Fridge-Rescue Recipe with Gemini
    const prompt = `
A kitchen in ${city} has the following perishable items expiring within 48 hours:
${expiringListStr}

Other active pantry staples currently available in their kitchen:
${JSON.stringify(activePantry)}

Generate an ultra-fast, aesthetic 15-minute "Fridge-Clearing Rescue Recipe" that heroically utilizes these expiring ingredients.
Ensure it is minimal effort, cafe-chic, and delicious.

Output format (clean WhatsApp markdown):
- *Fridge Rescue Tonight: [Recipe Title]*
- *Time:* 10-15 mins | *Effort:* Super Easy
- *Ingredients Needed:* (List what to use from what they already have)
- *3-Step Speed Method:*
  1. ...
  2. ...
  3. ...
- *Chef's Tip:* (A warm, encouraging note for a cozy meal)`;

    const recipeRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const messageText = recipeRes.text;

    // 3. Dispatch via Twilio WhatsApp API / n8n Webhook
    const dispatches = [];

    // Optional n8n Webhook forwarder
    if (process.env.N8N_ALERT_WEBHOOK_URL) {
      try {
        await fetch(process.env.N8N_ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            householdId,
            city,
            expiringItems: expiring,
            recipeMessage: messageText,
            recipientPhones: members.map(m => m.profiles?.phone_number).filter(Boolean)
          })
        });
        dispatches.push({ channel: 'n8n', status: 'sent' });
      } catch (err) {
        dispatches.push({ channel: 'n8n', error: err.message });
      }
    }

    // Direct Twilio WhatsApp dispatch
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
      for (const member of members) {
        const phone = member.profiles?.phone_number;
        if (!phone) continue;

        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
          const params = new URLSearchParams();
          params.append('From', `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`);
          params.append('To', `whatsapp:${phone.startsWith('+') ? phone : `+${phone}`}`);
          params.append('Body', messageText);

          const twilioResp = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
          });
          dispatches.push({ channel: 'twilio', phone, status: twilioResp.status });
        } catch (err) {
          dispatches.push({ channel: 'twilio', phone, error: err.message });
        }
      }
    }

    return NextResponse.json({
      success: true,
      recipe_message: messageText,
      dispatches
    });
  } catch (error) {
    console.error('Notify Expiring Webhook Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
