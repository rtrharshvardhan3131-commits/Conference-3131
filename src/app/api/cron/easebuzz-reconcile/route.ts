import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { reconcileStaleEasebuzzAttempts } from "@/server/easebuzz-settle"
import { logServerError } from "@/server/errors"

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const header = request.headers.get("authorization") ?? ""
  const expected = `Bearer ${secret}`
  const left = Buffer.from(header)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  try {
    const result = await reconcileStaleEasebuzzAttempts(30)
    return NextResponse.json(
      { ok: true, ...result },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (error) {
    logServerError("easebuzz_cron", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return run(request)
}

export async function POST(request: Request) {
  return run(request)
}
