"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createServerSupabase } from "@/lib/supabase/server"
import { requireActor } from "@/server/session"

export async function updateDelegateProfile(formData: FormData) {
  const actor = await requireActor()
  const phone = String(formData.get("phone") ?? "").trim()
  const emergencyName = String(formData.get("emergency_contact_name") ?? "").trim()
  const emergencyPhone = String(formData.get("emergency_contact_phone") ?? "").trim()
  const dietary = String(formData.get("dietary_preference") ?? "").trim()
  const accommodation = String(formData.get("accommodation_preference") ?? "").trim()
  const supabase = await createServerSupabase()
  await supabase.from("profiles").update({
    phone,
    emergency_contact_name: emergencyName,
    emergency_contact_phone: emergencyPhone,
    dietary_preference: dietary,
  }).eq("id", actor.id)
  const admin = createAdminClient()
  await admin.from("registrations").update({
    phone,
    emergency_contact_name: emergencyName,
    emergency_contact_phone: emergencyPhone,
    dietary_preference: dietary,
    accommodation_preference: accommodation,
  }).eq("user_id", actor.id).is("checked_in_at", null)
}

export async function submitDelegateSupport(formData: FormData) {
  const actor = await requireActor()
  const message = String(formData.get("message") ?? "").trim()
  if (message.length < 10) return
  const admin = createAdminClient()
  await admin.from("support_enquiries").insert({
    kind: "delegate_support",
    name: actor.email,
    email: actor.email,
    subject: "Delegate support",
    message,
    registration_id: String(formData.get("registration_id") ?? "") || null,
  })
}
