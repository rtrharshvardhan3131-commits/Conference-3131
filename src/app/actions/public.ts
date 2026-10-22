"use server"

import { headers } from "next/headers"
import { ZodError } from "zod"
import { matchDistrictMembers, normalizeRotaryId, type DistrictMemberLookup } from "@/domain/district-members"
import { contactSchema, interestSchema, sponsorshipSchema } from "@/domain/schemas"
import { isSupabaseConfigured } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEnquiryAcknowledgement } from "@/server/email"
import { setRegistrationAccess } from "@/server/access-cookie"
import { checkoutErrorMessage, previewRegistrationCoupon, startCheckout, type CheckoutStart } from "@/server/checkout"
import { readPhotographUpload, readRegistrationUpload } from "@/server/registration-documents"
import { getActor } from "@/server/session"
import { getCachedPublicSite } from "@/server/content"
import { logServerError, publicError } from "@/server/errors"

export type ActionState = { ok: boolean; message: string }

async function limit(action: string, subject: string, max = 5) {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_action: action,
    p_subject: subject,
    p_limit: max,
    p_window_seconds: 600,
  })
  if (error || data !== true) throw new Error("APP:rate_limited")
}

function clientAddress(headerStore: Headers) {
  return headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

export async function submitEnquiry(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    if (!isSupabaseConfigured()) return { ok: false, message: publicError("APP:unconfigured") }
    const parsed = contactSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
      companyWebsite: formData.get("companyWebsite") ?? "",
    })
    if (parsed.companyWebsite) return { ok: true, message: "Thank you. Your message has been received." }
    const headerStore = await headers()
    await limit("contact", `${clientAddress(headerStore)}:${parsed.email}`)
    const admin = createAdminClient()
    const { error } = await admin.from("support_enquiries").insert({
      kind: "contact",
      name: parsed.name,
      email: parsed.email,
      subject: parsed.subject,
      message: parsed.message,
    })
    if (error) {
      logServerError("contact_insert", error)
      return { ok: false, message: "The message could not be saved. Please try again." }
    }
    await sendEnquiryAcknowledgement(parsed.email, parsed.name)
    return { ok: true, message: "Thank you. Your message has been received." }
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, message: error.issues[0]?.message ?? "Check the form and try again." }
    return { ok: false, message: checkoutErrorMessage(error) }
  }
}

export async function submitSponsorship(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    if (!isSupabaseConfigured()) return { ok: false, message: publicError("APP:unconfigured") }
    const parsed = sponsorshipSchema.parse({
      organisation: formData.get("organisation"),
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      message: formData.get("message"),
      companyWebsite: formData.get("companyWebsite") ?? "",
    })
    if (parsed.companyWebsite) return { ok: true, message: "Thank you. The enquiry has been received." }
    const headerStore = await headers()
    await limit("sponsorship", `${clientAddress(headerStore)}:${parsed.email}`)
    const admin = createAdminClient()
    const { error } = await admin.from("support_enquiries").insert({
      kind: "sponsorship",
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      organisation: parsed.organisation,
      subject: "Sponsorship enquiry",
      message: parsed.message,
    })
    if (error) return { ok: false, message: "The enquiry could not be saved. Please try again." }
    return { ok: true, message: "Thank you. The sponsorship enquiry has been received." }
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, message: error.issues[0]?.message ?? "Check the form and try again." }
    return { ok: false, message: checkoutErrorMessage(error) }
  }
}

export async function previewCoupon(input: { code: string; slabId: string; councilMember: boolean }): Promise<{ ok: true; offer: { code: string; name: string; amountPaise: number; discountPaise: number } } | { ok: false; message: string }> {
  try {
    const headerStore = await headers()
    if (isSupabaseConfigured()) await limit("coupon", clientAddress(headerStore), 12)
    const offer = await previewRegistrationCoupon(input)
    if (!offer) return { ok: false, message: "That code is not an open offer." }
    return { ok: true, offer }
  } catch (error) {
    return { ok: false, message: checkoutErrorMessage(error) }
  }
}

export async function beginCheckout(formData: FormData): Promise<{ ok: true; data: CheckoutStart } | { ok: false; message: string }> {
  try {
    const headerStore = await headers()
    const rawDetails = formData.get("details")
    const details = typeof rawDetails === "string" ? JSON.parse(rawDetails) as unknown : null
    const mode = formData.get("mode")
    if (mode !== "manual") throw new Error("Pay the district account and upload the payment screenshot.")
    const site = await getCachedPublicSite()
    const actor = await getActor()
    if (isSupabaseConfigured()) {
      const email = details && typeof details === "object" && "email" in details ? String(details.email) : "unknown"
      await limit("register", `${clientAddress(headerStore)}:${email}`)
    }
    const governmentId = await readRegistrationUpload(formData.get("governmentId"), "government ID")
    const photograph = await readPhotographUpload(formData.get("photograph"))
    const proofValue = formData.get("paymentProof")
    const paymentProof = proofValue instanceof File && proofValue.size > 0 ? await readRegistrationUpload(proofValue, "payment screenshot") : null
    const data = await startCheckout({
      details,
      slabId: String(formData.get("slabId") ?? ""),
      consent: {
        terms: formData.get("terms") === "true",
        privacy: formData.get("privacy") === "true",
        refunds: formData.get("refunds") === "true",
        guidelines: formData.get("guidelines") === "true",
      },
      mode,
      manualReference: String(formData.get("manualReference") ?? ""),
      governmentId,
      photograph,
      paymentProof,
      requirements: site.event.fieldRequirements,
      policyVersion: site.event.policyVersion,
      userId: actor?.id ?? null,
      couponCode: String(formData.get("couponCode") ?? ""),
    })
    await setRegistrationAccess(data.registrationId)
    return { ok: true, data }
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, message: error.issues[0]?.message ?? "Check the form and try again." }
    if (error instanceof SyntaxError) return { ok: false, message: "Check the form and try again." }
    logServerError("checkout", error)
    return { ok: false, message: checkoutErrorMessage(error) }
  }
}

export async function lookupDistrictMember(rotaryId: string): Promise<DistrictMemberLookup> {
  const id = normalizeRotaryId(rotaryId)
  if (id.length < 6 || id.length > 40 || !/^[A-Za-z0-9-]+$/.test(id)) return { status: "skipped" }
  try {
    if (!isSupabaseConfigured()) return { status: "unavailable" }
    const headerStore = await headers()
    await limit("member_lookup", clientAddress(headerStore), 30)
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("district_members")
      .select("full_name, rotary_id, club, zone")
      .eq("rotary_id", id)
      .limit(5)
    if (error || !data) {
      logServerError("member_lookup", error)
      return { status: "unavailable" }
    }
    return matchDistrictMembers(
      data.map((row) => ({
        fullName: row.full_name,
        rotaryId: row.rotary_id,
        club: row.club,
        zone: row.zone,
      })),
      id,
    )
  } catch (error) {
    logServerError("member_lookup", error)
    return { status: "unavailable" }
  }
}

export async function subscribeInterest(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    if (!isSupabaseConfigured()) return { ok: false, message: publicError("APP:unconfigured") }
    const parsed = interestSchema.parse({
      email: formData.get("email"),
      topic: formData.get("topic"),
      companyWebsite: formData.get("companyWebsite") ?? "",
    })
    if (parsed.companyWebsite) return { ok: true, message: "You're on the list." }
    const headerStore = await headers()
    await limit("interest", `${clientAddress(headerStore)}:${parsed.email}`, 8)
    const admin = createAdminClient()
    const { error } = await admin.from("interest_signups").insert({ email: parsed.email, topic: parsed.topic })
    if (error && error.code !== "23505") {
      logServerError("interest_signup", error)
      return { ok: false, message: "This list is not open yet. Please try again later." }
    }
    return { ok: true, message: error?.code === "23505" ? "You're already on this list." : "You're on the list. We'll write when this is published." }
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, message: error.issues[0]?.message ?? "Enter a valid email address." }
    return { ok: false, message: checkoutErrorMessage(error) }
  }
}
