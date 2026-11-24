import { randomBytes } from "node:crypto"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { initiatePayment, isEasebuzzConfigured, paiseToAmount, siteUrl } from "@/lib/easebuzz"
import { createAdminClient } from "@/lib/supabase/admin"
import { logServerError, publicError } from "@/server/errors"

async function rateLimit(subject: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_action: "easebuzz_initiate",
    p_subject: subject,
    p_limit: 8,
    p_window_seconds: 600,
  })
  if (error || data !== true) throw new Error("APP:rate_limited")
}

function clientAddress(headerStore: Headers) {
  return headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

function txnidFor(registrationId: string) {
  return `SS${registrationId.replaceAll("-", "").slice(0, 12)}${Date.now().toString(36)}${randomBytes(3).toString("hex")}`.slice(0, 40)
}

export async function POST(request: Request) {
  try {
    if (!isEasebuzzConfigured()) {
      return NextResponse.json({ ok: false, message: publicError("APP:payment_unconfigured") }, { status: 503 })
    }
    const body = (await request.json()) as { registrationId?: unknown; amount?: unknown }
    if (body.amount !== undefined) {
      return NextResponse.json({ ok: false, message: "The payment amount is set on the server." }, { status: 400 })
    }
    const registrationId = typeof body.registrationId === "string" ? body.registrationId.trim() : ""
    if (!/^[0-9a-f-]{36}$/i.test(registrationId)) {
      return NextResponse.json({ ok: false, message: publicError("APP:not_found") }, { status: 404 })
    }

    const headerStore = await headers()
    await rateLimit(`${clientAddress(headerStore)}:${registrationId}`)

    const admin = createAdminClient()
    const { data: registration } = await admin
      .from("registrations")
      .select("id, status, amount_paise, full_name, email, phone, reference")
      .eq("id", registrationId)
      .maybeSingle()

    if (!registration) {
      return NextResponse.json({ ok: false, message: publicError("APP:not_found") }, { status: 404 })
    }
    if (registration.status !== "pending_payment" && registration.status !== "payment_failed") {
      return NextResponse.json({ ok: false, message: publicError("APP:registration_not_payable") }, { status: 409 })
    }

    if (registration.status === "payment_failed") {
      await admin.from("registrations").update({ status: "pending_payment", updated_at: new Date().toISOString() }).eq("id", registration.id)
    }

    const amount = paiseToAmount(registration.amount_paise)
    const txnid = txnidFor(registration.id)
    const returnUrl = `${siteUrl().replace(/\/$/, "")}/api/payments/easebuzz/return`

    const { error: insertError } = await admin.from("payment_attempts").insert({
      registration_id: registration.id,
      txnid,
      amount_paise: registration.amount_paise,
      status: "initiated",
    })
    if (insertError) {
      logServerError("easebuzz_attempt", insertError)
      return NextResponse.json({ ok: false, message: publicError("APP:unconfigured") }, { status: 500 })
    }

    const firstName = registration.full_name.trim().split(/\s+/)[0] || "Delegate"
    const { url } = await initiatePayment({
      txnid,
      amount,
      productinfo: "The SOVEREIGN Summit registration",
      firstname: firstName,
      email: registration.email,
      phone: registration.phone.replace(/\D/g, "").slice(-10),
      surl: returnUrl,
      furl: returnUrl,
      udf1: registration.id,
    })

    await admin
      .from("payments")
      .update({
        provider: "easebuzz",
        payment_method: "gateway",
        provider_order_id: txnid,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("registration_id", registration.id)

    return NextResponse.json(
      { ok: true, url },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (error) {
    logServerError("easebuzz_initiate", error)
    const message = error instanceof Error && error.message.startsWith("APP:")
      ? publicError(error.message)
      : publicError("APP:unconfigured")
    const status = error instanceof Error && error.message === "APP:rate_limited" ? 429 : 500
    return NextResponse.json({ ok: false, message }, { status })
  }
}
