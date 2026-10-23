"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { ZodError } from "zod"
import { isStaff } from "@/domain/permissions"
import { loginSchema } from "@/domain/schemas"
import { isSupabaseConfigured } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { createServerSupabase } from "@/lib/supabase/server"
import { getActor } from "@/server/session"

export async function signIn(_previous: { message: string }, formData: FormData) {
  if (!isSupabaseConfigured()) return { message: "Sign-in is not connected yet." }
  try {
    const parsed = loginSchema.parse({ email: formData.get("email"), password: formData.get("password") })
    const headerStore = await headers()
    const admin = createAdminClient()
    const subject = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || parsed.email
    const { data: allowed } = await admin.rpc("consume_rate_limit", {
      p_action: "login",
      p_subject: subject,
      p_limit: 8,
      p_window_seconds: 900,
    })
    if (allowed !== true) return { message: "Too many sign-in attempts. Please wait and try again." }
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.signInWithPassword(parsed)
    if (error) return { message: "The email or password was not accepted." }
  } catch (error) {
    if (error instanceof ZodError) return { message: error.issues[0]?.message ?? "Check the form and try again." }
    return { message: "Sign-in could not be completed." }
  }
  const actor = await getActor()
  redirect(actor && isStaff(actor.roles) ? "/admin" : "/delegate")
}

export async function sendMagicLink(_previous: { message: string }, formData: FormData) {
  if (!isSupabaseConfigured()) return { message: "Sign-in is not connected yet." }
  try {
    const email = String(formData.get("email") ?? "").trim()
    if (!email.includes("@")) return { message: "Enter the email address for the link." }
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback` },
    })
    if (error) return { message: "The sign-in link could not be sent. Check the email and try again." }
  } catch {
    return { message: "The sign-in link could not be sent." }
  }
  redirect("/login?sent=1")
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase()
    await supabase.auth.signOut()
  }
  redirect("/")
}
