import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export function createBrowserClient(config: { supabaseUrl: string, supabasePublishableKey: string }): SupabaseClient | null {
  if (!config.supabaseUrl || !config.supabasePublishableKey.startsWith('sb_publishable_')) return null
  try {
    return createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: { flowType: 'pkce', detectSessionInUrl: false, persistSession: true, autoRefreshToken: true },
    })
  }
  catch { return null }
}
