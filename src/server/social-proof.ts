import "server-only"
import { supabaseSecretKey } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"

export async function loadSocialProof(): Promise<{ delegates: number; clubs: number } | null> {
  try {
    if (!supabaseSecretKey()) return null
    const admin = createAdminClient()
    const { data, error } = await admin.from("registrations").select("club").in("status", ["pending_payment", "confirmed"])
    if (error || !data) return null
    const clubs = new Set(data.flatMap((row) => (typeof row.club === "string" && row.club.trim() ? [row.club] : []))).size
    return { delegates: data.length, clubs }
  } catch {
    return null
  }
}
