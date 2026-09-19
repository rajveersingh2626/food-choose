import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Household Invite Pairing Endpoint
 * GET: Retrieve or regenerate household invite code
 * POST: Accept an invite code and join a partner's household kitchen
 */
export async function GET(req) {
  try {
    const supabase = createServerSupabaseClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('household_id, households(id, name, invite_code)')
      .eq('id', user.id)
      .single();

    if (!profile?.household_id) {
      return NextResponse.json({ error: 'No active household' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      household: profile.households
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const supabase = createServerSupabaseClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invite_code } = await req.json();
    if (!invite_code || typeof invite_code !== 'string') {
      return NextResponse.json({ error: 'Valid invite code is required.' }, { status: 400 });
    }

    // Lookup household matching the 6-character invite code
    const { data: household, error: lookupError } = await supabase
      .from('households')
      .select('id, name')
      .eq('invite_code', invite_code.toUpperCase().trim())
      .single();

    if (lookupError || !household) {
      return NextResponse.json({ error: 'Invalid or expired invite code. Please verify and try again.' }, { status: 404 });
    }

    // Add user into the household members table
    const { error: joinError } = await supabase
      .from('household_members')
      .insert({
        household_id: household.id,
        user_id: user.id,
        role: 'member'
      });

    if (joinError && !joinError.message.includes('duplicate')) {
      throw joinError;
    }

    // Switch active household_id on user's profile
    await supabase
      .from('profiles')
      .update({ household_id: household.id, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      household,
      message: `You have successfully joined ${household.name}! Your pantry and meal planner are now synchronized.`
    });
  } catch (error) {
    console.error('Household Invite Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
