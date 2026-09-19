import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
);

/**
 * Supabase Service Layer for Frontend UI
 */
export const supabaseService = {
  // --------------------------------------------------------------------------
  // AUTHENTICATION
  // --------------------------------------------------------------------------
  async signUp(email, password, fullName, city = 'Mumbai') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, city }
      }
    });
    if (error) throw error;
    return data;
  },

  async signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signInWithOAuth(provider = 'google') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // --------------------------------------------------------------------------
  // USER & HOUSEHOLD
  // --------------------------------------------------------------------------
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, households(*)')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async joinHouseholdByInviteCode(inviteCode) {
    const session = await this.getCurrentSession();
    if (!session) throw new Error('You must be logged in to join a household.');

    const res = await fetch('/api/households/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ invite_code: inviteCode })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to join household');
    return result;
  },

  // --------------------------------------------------------------------------
  // PANTRY ITEMS (Scoped to Household with Soft-Deletes)
  // --------------------------------------------------------------------------
  async fetchActivePantry(householdId) {
    const { data, error } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('household_id', householdId)
      .eq('is_active', true)
      .order('added_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addPantryItem(householdId, item) {
    const session = await this.getCurrentSession();
    const user = session?.user;
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await supabase
      .from('pantry_items')
      .insert({
        household_id: householdId,
        created_by: user.id,
        item_name: item.name,
        category: item.category || 'staple',
        quantity: item.quantity || 1.0,
        unit: item.unit || 'units',
        brand: item.brand || null,
        expires_at: item.expires_at || null,
        is_active: true,
        source: 'manual'
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async softDeletePantryItem(itemId) {
    const { data, error } = await supabase
      .from('pantry_items')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePantryItem(itemId, updates) {
    const { data, error } = await supabase
      .from('pantry_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --------------------------------------------------------------------------
  // RECEIPT OCR UPLOAD
  // --------------------------------------------------------------------------
  async uploadReceiptScreenshot(imageFile) {
    const session = await this.getCurrentSession();
    if (!session) throw new Error('Must be logged in');

    const formData = new FormData();
    formData.append('receipt_image', imageFile);

    const res = await fetch('/api/pantry/ocr-receipt', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to parse receipt');
    return result;
  },

  // --------------------------------------------------------------------------
  // AESTHETIC AI MEAL GENERATOR
  // --------------------------------------------------------------------------
  async generateWeeklyPlan() {
    const session = await this.getCurrentSession();
    if (!session) throw new Error('Must be logged in');

    const res = await fetch('/api/ai/meal-planner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to generate meal plan');
    return result.plan;
  },

  // --------------------------------------------------------------------------
  // MEAL PLANS & IS_COOKED TRACKING
  // --------------------------------------------------------------------------
  async fetchMealPlans(householdId, startDate, endDate) {
    let query = supabase
      .from('meal_plans')
      .select('*, recipes(*)')
      .eq('household_id', householdId)
      .order('planned_date', { ascending: true });

    if (startDate) query = query.gte('planned_date', startDate);
    if (endDate) query = query.lte('planned_date', endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async markMealAsCooked(mealPlanId) {
    const { data, error } = await supabase
      .from('meal_plans')
      .update({
        is_cooked: true,
        cooked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', mealPlanId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --------------------------------------------------------------------------
  // MODULE 1: ZERO-TYPING INTAKE (VOICE DUMP & FRIDGE SWEEP)
  // --------------------------------------------------------------------------
  async submitVoiceDump(input) {
    const session = await this.getCurrentSession();
    if (!session) throw new Error('Must be logged in');

    let body;
    let headers = {
      'Authorization': `Bearer ${session.access_token}`
    };

    if (input instanceof Blob || input instanceof File) {
      const formData = new FormData();
      formData.append('audio', input);
      body = formData;
    } else if (typeof input === 'string') {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ transcript: input });
    }

    const res = await fetch('/api/pantry/voice-dump', {
      method: 'POST',
      headers,
      body
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to process voice dump');
    return result;
  },

  async submitFridgeSweep(mediaFile, sweepZone = 'fridge') {
    const session = await this.getCurrentSession();
    if (!session) throw new Error('Must be logged in');

    const formData = new FormData();
    formData.append('media', mediaFile);
    formData.append('sweep_zone', sweepZone);

    const res = await fetch('/api/pantry/fridge-sweep', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to process fridge sweep');
    return result;
  },

  // --------------------------------------------------------------------------
  // MODULE 3: GAMIFIED PANTRY AUDIT (TINDER-STYLE SWIPE HANDLERS)
  // --------------------------------------------------------------------------
  async fetchAuditQueue(householdId) {
    // Fetch active items that have an expiration date, prioritized by expiring soonest
    const { data, error } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('household_id', householdId)
      .eq('is_active', true)
      .not('expires_at', 'is', null)
      .order('expires_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async extendItemFreshness(itemId, extensionDays = 2) {
    // Attempt atomic RPC call first; fallback to direct update if RPC is pending migration
    try {
      const { data, error } = await supabase.rpc('extend_pantry_item_freshness', {
        target_item_id: itemId,
        extension_days: extensionDays
      });
      if (!error && data?.success) return data;
    } catch (rpcErr) {
      console.debug('RPC fallback to direct table update:', rpcErr);
    }

    // Direct update fallback
    const { data: current } = await supabase
      .from('pantry_items')
      .select('expires_at, audit_extension_count')
      .eq('id', itemId)
      .single();

    const currentExpiry = current?.expires_at ? new Date(current.expires_at) : new Date();
    const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()) + extensionDays * 24 * 3600 * 1000);

    const { data, error } = await supabase
      .from('pantry_items')
      .update({
        expires_at: newExpiry.toISOString(),
        last_audited_at: new Date().toISOString(),
        audit_extension_count: (current?.audit_extension_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, item: data };
  },

  async auditSoftDeleteItem(itemId) {
    // Attempt atomic RPC call first
    try {
      const { data, error } = await supabase.rpc('audit_soft_delete_pantry_item', {
        target_item_id: itemId
      });
      if (!error && data?.success) return data;
    } catch (rpcErr) {
      console.debug('RPC fallback to direct table update:', rpcErr);
    }

    // Direct update fallback
    const { data, error } = await supabase
      .from('pantry_items')
      .update({
        is_active: false,
        quantity: 0,
        last_audited_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, item: data };
  },

  async updateItemStorageMethod(itemId, newStorageMethod, newExpiresAt) {
    const updates = {
      storage_method: newStorageMethod,
      updated_at: new Date().toISOString()
    };
    if (newExpiresAt) updates.expires_at = newExpiresAt;

    const { data, error } = await supabase
      .from('pantry_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
