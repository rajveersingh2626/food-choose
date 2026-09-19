import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Daily Cron Execution Route (e.g., triggered by Vercel Cron or GitHub Action at 02:00 UTC)
 * 1. Decrements pantry inventory for any meal marked is_cooked = true.
 * 2. Soft-deletes pantry items whose quantity drops to 0 (never drops permanently).
 * 3. Scans for perishable items within 48h of expiration and fires proactive rescue alerts.
 */
export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
    }

    const adminClient = createAdminSupabaseClient();
    const deductions = [];

    // Step 1: Query meals marked as cooked whose ingredients haven't been deducted yet
    const { data: cookedMeals, error: mealError } = await adminClient
      .from('meal_plans')
      .select('id, household_id, ingredients, custom_title')
      .eq('is_cooked', true)
      .eq('pantry_deducted', false);

    if (mealError) throw mealError;

    for (const meal of cookedMeals || []) {
      const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];

      for (const ing of ingredients) {
        if (!ing?.name) continue;

        // Find active pantry item in the same household kitchen
        const { data: matches } = await adminClient
          .from('pantry_items')
          .select('id, item_name, quantity, unit, is_active')
          .eq('household_id', meal.household_id)
          .eq('is_active', true)
          .ilike('item_name', `%${ing.name.trim()}%`)
          .order('expires_at', { ascending: true, nullsFirst: false }) // Prioritize consuming older items
          .limit(1);

        if (matches && matches.length > 0) {
          const item = matches[0];
          const deductQty = Number(ing.quantity) || 1.0;
          const newQty = Math.max(0, Number(item.quantity) - deductQty);
          const shouldSoftDelete = newQty <= 0;

          await adminClient
            .from('pantry_items')
            .update({
              quantity: newQty,
              is_active: !shouldSoftDelete, // Soft delete when exhausted
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          deductions.push({
            meal_id: meal.id,
            pantry_item_id: item.id,
            item_name: item.item_name,
            deducted: deductQty,
            remaining: newQty,
            soft_deleted: shouldSoftDelete
          });
        }
      }

      // Mark meal plan as deducted
      await adminClient
        .from('meal_plans')
        .update({ pantry_deducted: true, updated_at: new Date().toISOString() })
        .eq('id', meal.id);
    }

    // Step 2: Scan for perishable items within 48h of expiration
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const { data: expiringItems, error: expireError } = await adminClient
      .from('pantry_items')
      .select('id, household_id, item_name, quantity, unit, expires_at')
      .eq('is_active', true)
      .eq('category', 'perishable')
      .gt('expires_at', now.toISOString())
      .lte('expires_at', in48Hours.toISOString());

    if (expireError) throw expireError;

    // Group expiring items by household
    const expiringByHousehold = {};
    for (const item of expiringItems || []) {
      if (!expiringByHousehold[item.household_id]) {
        expiringByHousehold[item.household_id] = [];
      }
      expiringByHousehold[item.household_id].push(item.id);
    }

    // Step 3: Trigger Proactive Recipe Webhook for households with expiring items
    const webhookResults = [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

    for (const [householdId, itemIds] of Object.entries(expiringByHousehold)) {
      try {
        const notifyRes = await fetch(`${appUrl}/api/webhooks/notify-expiring`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(cronSecret ? { 'Authorization': `Bearer ${cronSecret}` } : {})
          },
          body: JSON.stringify({ householdId, expiringItemIds: itemIds })
        });
        const resData = await notifyRes.json();
        webhookResults.push({ householdId, status: notifyRes.status, data: resData });
      } catch (err) {
        webhookResults.push({ householdId, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      deductions_processed: deductions.length,
      expiring_items_count: expiringItems?.length || 0,
      deductions,
      webhook_dispatches: webhookResults
    });
  } catch (error) {
    console.error('Pantry Maintenance Cron Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
