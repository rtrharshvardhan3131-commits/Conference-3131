import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { decideWebhookDelivery } from "@/domain/webhooks"
import { confirmCapturedPayment, verifyRazorpayWebhook } from "@/server/checkout"
import { logServerError } from "@/server/errors"
import { createAdminClient } from "@/lib/supabase/admin"

type RazorpayEvent = {
  id?: string
  event?: string
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; amount?: number; method?: string; status?: string } }
    refund?: { entity?: { id?: string; payment_id?: string; amount?: number } }
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()
  const body = await request.text()
  const signature = request.headers.get("x-razorpay-signature") ?? ""
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !verifyRazorpayWebhook(body, signature, secret)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  let event: RazorpayEvent
  try {
    event = JSON.parse(body) as RazorpayEvent
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  if (!event.id || !event.event) return NextResponse.json({ ok: false }, { status: 400 })

  const admin = createAdminClient()
  const { error: insertError } = await admin.from("webhook_events").insert({
    provider: "razorpay",
    provider_event_id: event.id,
    event_type: event.event,
    processing_status: "processing",
  })
  if (insertError) {
    const { data: existing } = await admin
      .from("webhook_events")
      .select("processing_status")
      .eq("provider", "razorpay")
      .eq("provider_event_id", event.id)
      .maybeSingle()
    const decision = decideWebhookDelivery(
      existing ? { processingStatus: existing.processing_status as "processing" | "processed" | "failed" } : { processingStatus: "processing" },
    )
    if (decision === "skip") return NextResponse.json({ ok: true, duplicate: true })
  }

  try {
    const paymentEntity = event.payload?.payment?.entity
    if (event.event === "payment.captured" && paymentEntity?.order_id && paymentEntity.amount && paymentEntity.id) {
      const { data: payment } = await admin
        .from("payments")
        .select("id, amount_paise")
        .eq("provider", "razorpay")
        .eq("provider_order_id", paymentEntity.order_id)
        .maybeSingle()
      if (!payment) throw new Error("APP:not_found")
      await confirmCapturedPayment({
        paymentId: payment.id,
        orderId: paymentEntity.order_id,
        providerPaymentId: paymentEntity.id,
        amountPaise: paymentEntity.amount,
        method: paymentEntity.method ?? null,
        signatureValid: true,
        reconciliation: "matched",
      })
    }
    if (event.event === "payment.failed" && paymentEntity?.order_id) {
      const { data: payment } = await admin.from("payments").select("id").eq("provider_order_id", paymentEntity.order_id).maybeSingle()
      if (payment) await admin.rpc("mark_payment_failed", { p_payment_id: payment.id })
    }
    await admin
      .from("webhook_events")
      .update({ processing_status: "processed", processed_at: new Date().toISOString(), error: null })
      .eq("provider", "razorpay")
      .eq("provider_event_id", event.id)
    revalidateTag("site-content", "max")
    return NextResponse.json({ ok: true })
  } catch (error) {
    logServerError("razorpay_webhook", error, requestId)
    await admin
      .from("webhook_events")
      .update({ processing_status: "failed", error: "processing_failed" })
      .eq("provider", "razorpay")
      .eq("provider_event_id", event.id)
    return NextResponse.json({ ok: false, requestId }, { status: 500 })
  }
}
