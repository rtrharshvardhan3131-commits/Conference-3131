import { NextResponse } from "next/server"
import { setRegistrationAccess } from "@/server/access-cookie"
import { checkoutErrorMessage, confirmCapturedPayment, verifyRazorpayPayment } from "@/server/checkout"
import { logServerError } from "@/server/errors"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()
  try {
    const body = (await request.json()) as {
      mode?: string
      paymentId?: string
      orderId?: string
      providerPaymentId?: string
      signature?: string
    }
    if (!body.paymentId) return NextResponse.json({ ok: false }, { status: 400 })
    const admin = createAdminClient()
    const { data: payment } = await admin.from("payments").select("id, provider, amount_paise, provider_order_id").eq("id", body.paymentId).maybeSingle()
    if (!payment) return NextResponse.json({ ok: false }, { status: 404 })

    if (body.mode === "simulation") {
      return NextResponse.json({ ok: false }, { status: 403 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret || !body.orderId || !body.providerPaymentId || !body.signature) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    if (payment.provider_order_id && payment.provider_order_id !== body.orderId) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    const signatureValid = verifyRazorpayPayment(body.orderId, body.providerPaymentId, body.signature, secret)
    const result = await confirmCapturedPayment({
      paymentId: payment.id,
      orderId: body.orderId,
      providerPaymentId: body.providerPaymentId,
      amountPaise: payment.amount_paise,
      method: null,
      signatureValid,
      reconciliation: "matched",
    })
    await setRegistrationAccess(result.registrationId)
    return NextResponse.json({ ok: true, reference: result.reference })
  } catch (error) {
    logServerError("payment_verify", error, requestId)
    return NextResponse.json({ ok: false, message: checkoutErrorMessage(error), requestId }, { status: 400 })
  }
}
