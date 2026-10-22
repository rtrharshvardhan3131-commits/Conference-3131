import "server-only"
import { normalizeRotaryId } from "@/domain/district-members"
import { supabaseSecretKey } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { setRegistrationAccess } from "@/server/access-cookie"

export async function lookupRegistration(referenceInput: string, emailInput: string) {
  const reference = normalizeRotaryId(referenceInput).toUpperCase()
  const email = emailInput.trim().toLowerCase()
  if (reference.length < 4 || !email.includes("@")) return "invalid" as const
  if (!supabaseSecretKey()) return "missing" as const

  const admin = createAdminClient()
  const { data } = await admin.from("registrations").select("id, email").eq("reference", reference.toUpperCase()).maybeSingle()
  if (!data || data.email.toLowerCase() !== email) return "missing" as const
  await setRegistrationAccess(data.id)
  return "found" as const
}
