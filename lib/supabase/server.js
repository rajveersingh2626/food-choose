import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client for API Route Handlers.
 * Extracts JWT Bearer token from Request headers or cookies to enforce user context & RLS.
 */
export function createServerSupabaseClient(req) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  let authHeader = '';
  if (req) {
    if (typeof req.headers?.get === 'function') {
      authHeader = req.headers.get('authorization') || '';
    } else if (req.headers?.authorization) {
      authHeader = req.headers.authorization;
    }
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}
