import { createBrowserClient } from "@supabase/ssr"
import { supabasePublishableKey, supabaseUrl } from "@/lib/env"

export function createBrowserSupabase() {
  const key = supabasePublishableKey()
  if (!key) throw new Error("Supabase publishable key is not configured.")
  return createBrowserClient(supabaseUrl(), key)
}
