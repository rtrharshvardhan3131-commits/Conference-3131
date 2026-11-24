import "server-only"
import {
  amountToPaise,
  easebuzzCredentials,
  normalizeGatewayStatus,
  retrieveTransaction,
  verifyResponseHash,
  type EasebuzzCallbackPayload,
} from "@/lib/easebuzz"
import { createAdminClient } from "@/lib/supabase/admin"
import { codeFromDatabase, logServerError } from "@/server/errors"
import { sendRegistrationEmail, registrationMailFromRow } from "@/server/email"

export type SettleDisplayState = "confirmed" | "failed" | "pending" | "invalid"

export type SettleResult = {
  state: SettleDisplayState
  registrationId: string | null
  reference: string | null
  txnid: string | null
}

function payloadRecord(payload: EasebuzzCallbackPayload): Record<string, string> {
  const record: Record<string, string> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") record[key] = value
  }
  return record
}

async function markAttempt(
  txnid: string,
  status: "failed" | "pending" | "invalid",
  payload: EasebuzzCallbackPayload,
) {
  const admin = createAdminClient()
  await admin
    .from("payment_attempts")
    .update({
      status,
      easepayid: payload.easepayid ?? null,
      bank_ref_num: payload.bank_ref_num ?? null,
      mode: payload.mode ?? null,
      raw_response: payloadRecord(payload),
      updated_at: new Date().toISOString(),
    })
    .eq("txnid", txnid)
}

async function markRegistrationPaymentFailed(registrationId: string) {
  const admin = createAdminClient()
  const { data: payment } = await admin
    .from("payments")
    .select("id")
    .eq("registration_id", registrationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!payment) return
  await admin.rpc("mark_payment_failed", { p_payment_id: payment.id })
}

async function sendConfirmedEmail(registrationId: string) {
  const admin = createAdminClient()
  const { data: registration } = await admin
    .from("registrations")
    .select("id, reference, email, full_name, phone, club, designation, district_zone, participant_role, rotary_id, tshirt_size, council_member, council_position, slab_name_snapshot, amount_paise")
    .eq("id", registrationId)
    .maybeSingle()
  if (!registration) return
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
      reference: registration.reference,
      slab_name_snapshot: registration.slab_name_snapshot,
      amount_paise: registration.amount_paise,
    }),
    registrationId: registration.id,
  })
}

export async function settleEasebuzzPayment(payload: EasebuzzCallbackPayload): Promise<SettleResult> {
  const txnid = payload.txnid?.trim() ?? ""
  if (!txnid) return { state: "invalid", registrationId: null, reference: null, txnid: null }

  const admin = createAdminClient()
  const { data: attempt } = await admin
    .from("payment_attempts")
    .select("id, registration_id, amount_paise, status")
    .eq("txnid", txnid)
    .maybeSingle()

  if (!attempt) {
    return { state: "invalid", registrationId: null, reference: null, txnid }
  }

  if (attempt.status === "success") {
    const { data: registration } = await admin.from("registrations").select("reference").eq("id", attempt.registration_id).maybeSingle()
    return {
      state: "confirmed",
      registrationId: attempt.registration_id,
      reference: registration?.reference ?? null,
      txnid,
    }
  }

  let credentials
  try {
    credentials = easebuzzCredentials()
  } catch {
    await markAttempt(txnid, "invalid", payload)
    return { state: "invalid", registrationId: attempt.registration_id, reference: null, txnid }
  }

  if (!verifyResponseHash(payload, credentials.salt, credentials.key)) {
    await markAttempt(txnid, "invalid", payload)
    return { state: "invalid", registrationId: attempt.registration_id, reference: null, txnid }
  }

  const callbackPaise = amountToPaise(payload.amount)
  if (callbackPaise == null || callbackPaise !== attempt.amount_paise) {
    await markAttempt(txnid, "invalid", payload)
    return { state: "invalid", registrationId: attempt.registration_id, reference: null, txnid }
  }

  const gatewayStatus = normalizeGatewayStatus(payload.status)
  if (gatewayStatus === "failure" || gatewayStatus === "userCancelled") {
    await markAttempt(txnid, "failed", payload)
    await markRegistrationPaymentFailed(attempt.registration_id)
    return { state: "failed", registrationId: attempt.registration_id, reference: null, txnid }
  }

  if (gatewayStatus !== "success") {
    await markAttempt(txnid, "pending", payload)
    return { state: "pending", registrationId: attempt.registration_id, reference: null, txnid }
  }

  let retrieve
  try {
    retrieve = await retrieveTransaction(txnid)
  } catch (error) {
    logServerError("easebuzz_retrieve", error)
    await markAttempt(txnid, "pending", payload)
    return { state: "pending", registrationId: attempt.registration_id, reference: null, txnid }
  }

  if (!retrieve.ok || normalizeGatewayStatus(retrieve.status) !== "success") {
    await markAttempt(txnid, "pending", {
      ...payload,
      status: retrieve.status || payload.status,
      amount: retrieve.amount || payload.amount,
      easepayid: retrieve.easepayid ?? payload.easepayid,
      mode: retrieve.mode ?? payload.mode,
      bank_ref_num: retrieve.bankRefNum ?? payload.bank_ref_num,
    })
    return { state: "pending", registrationId: attempt.registration_id, reference: null, txnid }
  }

  const retrievePaise = amountToPaise(retrieve.amount || payload.amount)
  if (retrievePaise == null || retrievePaise !== attempt.amount_paise) {
    await markAttempt(txnid, "invalid", payload)
    return { state: "invalid", registrationId: attempt.registration_id, reference: null, txnid }
  }

  const confirmPayload = {
    ...payloadRecord(payload),
    amount: retrieve.amount || payload.amount,
    status: "success",
    easepayid: retrieve.easepayid ?? payload.easepayid ?? "",
    mode: retrieve.mode ?? payload.mode ?? "",
    bank_ref_num: retrieve.bankRefNum ?? payload.bank_ref_num ?? "",
  }

  const { data, error } = await admin.rpc("confirm_gateway_payment", {
    p_txnid: txnid,
    p_easepayid: confirmPayload.easepayid,
    p_payload: confirmPayload,
  })

  if (error || !data) {
    const code = codeFromDatabase(error?.message)
    logServerError("easebuzz_confirm", error ?? { code: "unknown" })
    if (code === "APP:amount_mismatch") {
      return { state: "invalid", registrationId: attempt.registration_id, reference: null, txnid }
    }
    await markAttempt(txnid, "pending", payload)
    return { state: "pending", registrationId: attempt.registration_id, reference: null, txnid }
  }

  const result = data as { idempotent?: boolean; reference?: string; registration_id?: string; state?: string }
  if (!result.idempotent && result.registration_id) {
    try {
      await sendConfirmedEmail(result.registration_id)
    } catch (emailError) {
      logServerError("registration_email", emailError)
    }
  }

  return {
    state: "confirmed",
    registrationId: result.registration_id ?? attempt.registration_id,
    reference: result.reference ?? null,
    txnid,
  }
}

export async function reconcileStaleEasebuzzAttempts(olderThanMinutes = 30): Promise<{ checked: number; settled: number }> {
  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000).toISOString()
  const { data: attempts } = await admin
    .from("payment_attempts")
    .select("txnid, registration_id, amount_paise")
    .in("status", ["initiated", "pending"])
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(50)

  let settled = 0
  for (const attempt of attempts ?? []) {
    try {
      const retrieve = await retrieveTransaction(attempt.txnid)
      const status = normalizeGatewayStatus(retrieve.status)
      const payload: EasebuzzCallbackPayload = {
        status: status === "success" ? "success" : status === "userCancelled" ? "userCancelled" : status === "failure" ? "failure" : retrieve.status || "pending",
        txnid: attempt.txnid,
        amount: retrieve.amount || paiseFallback(attempt.amount_paise),
        productinfo: "The SOVEREIGN Summit registration",
        firstname: "Delegate",
        email: "reconcile@invalid.local",
        hash: "",
        easepayid: retrieve.easepayid ?? undefined,
        mode: retrieve.mode ?? undefined,
        bank_ref_num: retrieve.bankRefNum ?? undefined,
      }

      // Rebuild a verifiable path only for Retrieve-backed success using the RPC directly after amount checks.
      if (status === "success") {
        const retrievePaise = amountToPaise(retrieve.amount)
        if (retrievePaise == null || retrievePaise !== attempt.amount_paise) {
          await markAttempt(attempt.txnid, "invalid", payload)
          continue
        }
        const { data, error } = await admin.rpc("confirm_gateway_payment", {
          p_txnid: attempt.txnid,
          p_easepayid: retrieve.easepayid ?? "",
          p_payload: {
            amount: retrieve.amount,
            status: "success",
            easepayid: retrieve.easepayid ?? "",
            mode: retrieve.mode ?? "",
            bank_ref_num: retrieve.bankRefNum ?? "",
            source: "reconcile",
          },
        })
        if (!error && data) {
          const result = data as { idempotent?: boolean; registration_id?: string }
          if (!result.idempotent && result.registration_id) {
            try {
              await sendConfirmedEmail(result.registration_id)
            } catch (emailError) {
              logServerError("registration_email", emailError)
            }
          }
          settled += 1
        }
        continue
      }

      if (status === "failure" || status === "userCancelled") {
        await markAttempt(attempt.txnid, "failed", payload)
        await markRegistrationPaymentFailed(attempt.registration_id)
        settled += 1
      }
    } catch (error) {
      logServerError("easebuzz_reconcile", error)
    }
  }

  return { checked: attempts?.length ?? 0, settled }
}

function paiseFallback(paise: number): string {
  return (paise / 100).toFixed(2)
}
