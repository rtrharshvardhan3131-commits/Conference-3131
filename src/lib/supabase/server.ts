import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { supabasePublishableKey, supabaseUrl } from "@/lib/env"

export async function createServerSupabase() {
  const key = supabasePublishableKey()
  if (!key) throw new Error("Supabase publishable key is not configured.")
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl(), key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot always write cookies. The proxy refreshes the session.
        }
      },
    },
  })
}
