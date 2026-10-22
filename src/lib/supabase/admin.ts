import "server-only"
import { createClient } from "@supabase/supabase-js"
import { supabaseSecretKey, supabaseUrl } from "@/lib/env"

export function createAdminClient() {
  const key = supabaseSecretKey()
  if (!key) throw new Error("Supabase secret key is not configured.")
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
