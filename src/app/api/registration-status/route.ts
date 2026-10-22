import { NextResponse } from "next/server"
import { lookupRegistration } from "@/server/registration-lookup"

export async function POST(request: Request) {
  const form = await request.formData()
  const result = await lookupRegistration(String(form.get("reference") ?? ""), String(form.get("email") ?? ""))
  const destination = result === "found" ? "/register/confirmation" : `/register/status?notice=${result}`
  return NextResponse.redirect(new URL(destination, request.url), 303)
}
