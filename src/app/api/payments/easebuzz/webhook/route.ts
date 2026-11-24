import { NextResponse } from "next/server"
import { parseEasebuzzForm } from "@/lib/easebuzz"
import { settleEasebuzzPayment } from "@/server/easebuzz-settle"
import { logServerError } from "@/server/errors"

/**
 * Register this URL in the Easebuzz dashboard webhook settings:
 * https://<your-host>/api/payments/easebuzz/webhook
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? ""
    let payload
    if (contentType.includes("application/json")) {
      const json = (await request.json()) as Record<string, string>
      payload = parseEasebuzzForm(json)
    } else {
      payload = parseEasebuzzForm(await request.formData())
    }
    await settleEasebuzzPayment(payload)
  } catch (error) {
    logServerError("easebuzz_webhook", error)
  }
  return NextResponse.json(
    { ok: true },
    { status: 200, headers: { "Cache-Control": "private, no-store" } },
  )
}
