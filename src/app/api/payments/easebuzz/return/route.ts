import { NextResponse } from "next/server"
import { parseEasebuzzForm, siteUrl } from "@/lib/easebuzz"
import { setRegistrationAccess } from "@/server/access-cookie"
import { settleEasebuzzPayment } from "@/server/easebuzz-settle"
import { logServerError } from "@/server/errors"

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const payload = parseEasebuzzForm(form)
    const result = await settleEasebuzzPayment(payload)
    if (result.registrationId) await setRegistrationAccess(result.registrationId)
    const base = siteUrl().replace(/\/$/, "")
    const url = new URL(`${base}/register/confirmation`)
    url.searchParams.set("notice", result.state)
    if (result.txnid) url.searchParams.set("txnid", result.txnid)
    return NextResponse.redirect(url, 303)
  } catch (error) {
    logServerError("easebuzz_return", error)
    const base = siteUrl().replace(/\/$/, "")
    const url = new URL(`${base}/register/confirmation`)
    url.searchParams.set("notice", "pending")
    return NextResponse.redirect(url, 303)
  }
}
