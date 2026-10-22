import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { signingSecret } from "@/lib/env"

const COOKIE = "ss_registration"

export async function setRegistrationAccess(registrationId: string) {
  const secret = signingSecret()
  if (!secret) return
  const expires = Date.now() + 30 * 24 * 60 * 60 * 1000
  const payload = `${registrationId}.${expires}`
  const signature = createHmac("sha256", secret).update(payload).digest("base64url")
  const store = await cookies()
  store.set(COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  })
}

export async function readRegistrationAccess(): Promise<string | null> {
  const secret = signingSecret()
  if (!secret) return null
  const value = (await cookies()).get(COOKIE)?.value
  if (!value) return null
  const [registrationId, expires, signature] = value.split(".")
  if (!registrationId || !expires || !signature || Number(expires) < Date.now()) return null
  const expected = createHmac("sha256", secret).update(`${registrationId}.${expires}`).digest("base64url")
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null
  return registrationId
}
