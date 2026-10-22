import { createClient } from "@supabase/supabase-js"
import { supabasePublishableKey, supabaseUrl } from "@/lib/env"

export function createPublicClient() {
  const key = supabasePublishableKey()
  if (!key) throw new Error("Supabase publishable key is not configured.")
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
