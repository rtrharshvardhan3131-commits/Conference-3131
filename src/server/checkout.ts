import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import { isCouncilPosition } from "@/domain/council-positions"
import { couponCodeIsWellFormed, normalizeCouponCode, quoteCoupon, type StoredCoupon } from "@/domain/coupons"
import { fieldRequirementsMet, registrationDetailsSchema } from "@/domain/schemas"
import type { FieldRequirements } from "@/domain/public-site"
import { decidePaymentConfirmation } from "@/domain/payments"
import { formatInrFromPaise, pricesMatch } from "@/domain/money"
import { participantRoleLabel } from "@/domain/participant-role"
import { normalizeRotaryId } from "@/domain/district-members"
import { ensureDelegateAccount } from "@/server/delegate-account"
import { appUrl, isPaymentConfigured, supabaseSecretKey } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { codeFromDatabase, logServerError, publicError } from "@/server/errors"
import { sendRegistrationEmail, registrationMailFromRow } from "@/server/email"
import { discardRegistrationDocuments, storeRegistrationDocument, type StoredRegistrationDocument } from "@/server/registration-documents"

export type CheckoutInput = {
  details: unknown
  slabId: string
  consent: { terms: boolean; privacy: boolean; refunds: boolean; guidelines: boolean }
  mode: "razorpay" | "manual"
  manualReference?: string
  governmentId: StoredRegistrationDocument
  photograph: StoredRegistrationDocument
  paymentProof: StoredRegistrationDocument | null
  requirements: FieldRequirements
  policyVersion: string
  userId: string | null
  couponCode: string
}

export type CheckoutStart = {
  registrationId: string
  paymentId: string
  reference: string
  amountPaise: number
  currency: "INR"
  slabName: string
  orderId: string | null
  keyId: string | null
  mode: "razorpay" | "manual"
}

function signaturesMatch(expected: string, actual: string): boolean {
  const left = Buffer.from(expected)
  const right = Buffer.from(actual)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function verifyRazorpayPayment(orderId: string, paymentId: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex")
  return signaturesMatch(expected, signature)
}

export function verifyRazorpayWebhook(body: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex")
  return signaturesMatch(expected, signature)
}

async function createRazorpayOrder(amountPaise: number, reference: string, registrationId: string) {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) throw new Error("APP:payment_unconfigured")
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: reference,
      notes: { registration_id: registrationId },
    }),
  })
  if (!response.ok) {
    logServerError("razorpay_order", { code: response.status })
    throw new Error("APP:payment_unconfigured")
  }
  const body = (await response.json()) as { id?: string; amount?: number }
  if (!body.id || body.amount !== amountPaise) throw new Error("APP:amount_mismatch")
  return body.id
}

export async function openRazorpayOrder(amountPaise: number, reference: string) {
  if (!isPaymentConfigured()) throw new Error("APP:payment_unconfigured")
  const orderId = await createRazorpayOrder(amountPaise, reference, reference)
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  if (!keyId) throw new Error("APP:payment_unconfigured")
  return { orderId, keyId, testMode: keyId.startsWith("rzp_test_") }
}

export async function previewRegistrationCoupon(input: { code: string; slabId: string; councilMember: boolean }) {
  const code = normalizeCouponCode(input.code)
  if (!couponCodeIsWellFormed(code) || !supabaseSecretKey()) return null
  const admin = createAdminClient()
  const now = new Date()
  let pricePaise: number | null = null
  if (input.councilMember) {
    const { data } = await admin
      .from("registration_slabs")
      .select("price_paise")
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .order("price_paise", { ascending: true })
      .limit(1)
      .maybeSingle()
    pricePaise = typeof data?.price_paise === "number" ? data.price_paise : null
  } else {
    const { data } = await admin
      .from("registration_slabs")
      .select("price_paise, status, starts_at, ends_at")
      .eq("id", input.slabId)
      .maybeSingle()
    if (!data || data.status !== "published" || now < new Date(data.starts_at) || now > new Date(data.ends_at)) return null
    pricePaise = data.price_paise
  }
  if (!pricePaise) return null
  const { data: row } = await admin
    .from("coupons")
    .select("code, name, kind, percent, value_paise, status, starts_at, ends_at, quantity_limit, quantity_used")
    .eq("code", code)
    .maybeSingle()
  if (!row || (row.kind !== "percent" && row.kind !== "amount") || (row.status !== "draft" && row.status !== "published" && row.status !== "archived")) return null
  const coupon: StoredCoupon = {
    code: row.code,
    name: row.name,
    kind: row.kind,
    percent: row.percent,
    amountPaise: row.value_paise,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    quantityLimit: row.quantity_limit,
    quantityUsed: row.quantity_used,
  }
  const quote = quoteCoupon(pricePaise, coupon, now)
  return quote.ok ? quote : null
}

export async function startCheckout(input: CheckoutInput): Promise<CheckoutStart> {
  if (!supabaseSecretKey()) throw new Error("APP:unconfigured")
  const details = registrationDetailsSchema.parse(input.details)
  const requirementError = fieldRequirementsMet(details, input.requirements)
  if (requirementError) throw new Error(requirementError)
  const councilMember = details.councilMember
  const councilPosition = councilMember ? details.councilPosition : ""
  if (councilMember && !isCouncilPosition(councilPosition)) throw new Error("APP:council_position_required")
  if (!input.consent.terms || !input.consent.privacy || !input.consent.refunds || !input.consent.guidelines) {
    throw new Error("APP:consent_required")
  }
  if (input.mode === "razorpay" && !isPaymentConfigured()) throw new Error("APP:payment_unconfigured")
  const manualReference = (input.manualReference ?? "").trim()
  if (input.mode === "manual" && !input.paymentProof) {
    throw new Error("Upload a payment screenshot before submitting for finance review.")
  }
  if (input.mode === "manual" && manualReference.length > 0 && manualReference.length < 6) {
    throw new Error("Enter the payment reference issued for the District Bank Account.")
  }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc("create_pending_registration", {
    p_user_id: input.userId,
    p_full_name: details.fullName,
    p_email: details.email,
    p_phone: details.phone,
    p_club: details.club,
    p_designation: details.designation,
    p_district_zone: details.districtZone,
    p_emergency_name: details.emergencyContactName,
    p_emergency_phone: details.emergencyContactPhone,
    p_dietary: details.dietaryPreference,
    p_accommodation: details.accommodationPreference,
    p_slab_id: input.slabId,
    p_policy_version: input.policyVersion,
    p_provider: input.mode,
    p_manual_reference: manualReference,
    p_council_member: councilMember,
    p_council_position: councilPosition,
    p_coupon_code: normalizeCouponCode(input.couponCode),
  })
  if (error || !data) {
    const code = codeFromDatabase(error?.message)
    throw new Error(code ?? "APP:unconfigured")
  }
  const created = asCreated(data)
  try {
    const governmentPath = await storeRegistrationDocument(created.registration_id, "government-id", input.governmentId)
    const photographPath = await storeRegistrationDocument(created.registration_id, "photograph", input.photograph)
    const rotaryReference = normalizeRotaryId(details.rotaryId).toUpperCase()
    const { error: idError } = await admin.from("registrations").update({
      reference: rotaryReference,
      government_id_path: governmentPath,
      government_id_filename: input.governmentId.filename,
      photograph_path: photographPath,
      photograph_filename: input.photograph.filename,
      participant_role: details.participantRole,
      rotary_id: rotaryReference,
      tshirt_size: details.tshirtSize,
    }).eq("id", created.registration_id)
    if (idError?.code === "23505") throw new Error("This Rotary ID is already registered.")
    if (idError) throw new Error("The files could not be saved. Please try again.")
    if (input.paymentProof) {
      const proofPath = await storeRegistrationDocument(created.registration_id, "payment-proof", input.paymentProof)
      const { error: proofError } = await admin.from("payments").update({
        proof_path: proofPath,
        proof_filename: input.paymentProof.filename,
      }).eq("id", created.payment_id)
      if (proofError) throw new Error("The files could not be saved. Please try again.")
    }
  } catch (uploadError) {
    try {
      await discardRegistrationDocuments(created.registration_id)
    } catch (cleanupError) {
      logServerError("registration_document_cleanup", cleanupError)
    }
    if (uploadError instanceof Error && uploadError.message.endsWith(".")) throw uploadError
    throw new Error("The files could not be saved. Please try again.")
  }
  let loginPassword: string | null = null
  try {
    const account = await ensureDelegateAccount(details.email, details.fullName)
    loginPassword = account.password
    const { error: accountError } = await admin.from("registrations").update({ user_id: account.userId }).eq("id", created.registration_id)
    if (accountError) logServerError("delegate_account", accountError)
  } catch (accountError) {
    logServerError("delegate_account", accountError)
  }
  const reference = normalizeRotaryId(details.rotaryId).toUpperCase()
  if (input.mode === "manual") {
    try {
      await sendRegistrationEmail({
        kind: "submitted",
        registrationId: created.registration_id,
        name: details.fullName,
        email: details.email,
        phone: details.phone,
        role: participantRoleLabel(details.participantRole),
        rotaryId: reference,
        tshirtSize: details.tshirtSize,
        club: details.club,
        designation: details.designation,
        zone: details.districtZone,
        councilMember,
        councilPosition,
        reference,
        slabName: created.slab_name,
        amountLabel: formatInrFromPaise(created.amount_paise),
        loginPassword: loginPassword ?? undefined,
        loginUrl: `${appUrl()}/login`,
      })
    } catch (emailError) {
      logServerError("registration_email", emailError)
    }
  }
  if (input.mode === "razorpay") {
    const orderId = await createRazorpayOrder(created.amount_paise, reference, created.registration_id)
    const { error: updateError } = await admin
      .from("payments")
      .update({ provider_order_id: orderId, status: "pending" })
      .eq("id", created.payment_id)
    if (updateError) throw new Error("APP:unconfigured")
    return {
      registrationId: created.registration_id,
      paymentId: created.payment_id,
      reference,
      amountPaise: created.amount_paise,
      currency: "INR",
      slabName: created.slab_name,
      orderId,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? null,
      mode: "razorpay",
    }
  }
  return {
    registrationId: created.registration_id,
    paymentId: created.payment_id,
    reference,
    amountPaise: created.amount_paise,
    currency: "INR",
    slabName: created.slab_name,
    orderId: null,
    keyId: null,
    mode: input.mode,
  }
}

function asCreated(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("APP:unconfigured")
  const row = value as Record<string, unknown>
  if (
    typeof row.registration_id !== "string" ||
    typeof row.payment_id !== "string" ||
    typeof row.reference !== "string" ||
    typeof row.amount_paise !== "number" ||
    typeof row.slab_name !== "string"
  ) {
    throw new Error("APP:unconfigured")
  }
  return {
    registration_id: row.registration_id,
    payment_id: row.payment_id,
    reference: row.reference,
    amount_paise: row.amount_paise,
    slab_name: row.slab_name,
  }
}

export async function confirmCapturedPayment(args: {
  paymentId: string
  orderId: string | null
  providerPaymentId: string | null
  amountPaise: number
  method: string | null
  signatureValid: boolean
  reconciliation: "matched" | "simulated" | "manually_verified"
}): Promise<{ reference: string; registrationId: string; idempotent: boolean }> {
  const admin = createAdminClient()
  const { data: payment, error } = await admin
    .from("payments")
    .select("id, registration_id, amount_paise, status, provider")
    .eq("id", args.paymentId)
    .maybeSingle()
  if (error || !payment) throw new Error("APP:not_found")
  const { data: registration } = await admin
    .from("registrations")
    .select("id, status, reference, email, full_name, phone, club, designation, district_zone, participant_role, rotary_id, tshirt_size, council_member, council_position, slab_name_snapshot")
    .eq("id", payment.registration_id)
    .maybeSingle()
  if (!registration) throw new Error("APP:not_found")
  const decision = decidePaymentConfirmation({
    signatureValid: args.signatureValid,
    amountMatches: pricesMatch(payment.amount_paise, args.amountPaise),
    alreadyCaptured: payment.status === "captured",
    registrationStatus: registration.status,
  })
  if (!decision.confirm) throw new Error(`APP:${decision.reason}`)
  const { data, error: applyError } = await admin.rpc("apply_verified_payment", {
    p_payment_id: payment.id,
    p_provider_order_id: args.orderId,
    p_provider_payment_id: args.providerPaymentId,
    p_amount_paise: payment.amount_paise,
    p_method: args.method,
    p_reconciliation: args.reconciliation,
  })
  if (applyError || !data) {
    const code = codeFromDatabase(applyError?.message)
    throw new Error(code ?? "APP:invalid_transition")
  }
  const result = data as { idempotent: boolean; reference: string; registration_id: string }
  if (!result.idempotent) {
    try {
      await sendRegistrationEmail({
        ...registrationMailFromRow({
          kind: "confirmed",
          full_name: registration.full_name,
          email: registration.email,
          phone: registration.phone,
          participant_role: registration.participant_role,
          rotary_id: registration.rotary_id,
          tshirt_size: registration.tshirt_size,
          club: registration.club,
          designation: registration.designation,
          district_zone: registration.district_zone,
          council_member: registration.council_member,
          council_position: registration.council_position,
          reference: result.reference,
          slab_name_snapshot: registration.slab_name_snapshot,
          amount_paise: payment.amount_paise,
        }),
        registrationId: registration.id,
      })
    } catch (emailError) {
      logServerError("registration_email", emailError)
    }
  }
  return { reference: result.reference, registrationId: result.registration_id, idempotent: result.idempotent }
}

export function checkoutErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.startsWith("APP:")) return publicError(error.message)
    if (error.message.startsWith("Enter ") || error.message.endsWith(".")) return error.message
  }
  return publicError("APP:unconfigured")
}
