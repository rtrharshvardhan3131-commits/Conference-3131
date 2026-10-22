import { NextResponse } from "next/server"
import { mimeForRegistrationPath } from "@/domain/documents"
import { hasPermission } from "@/domain/permissions"
import { isSupabaseConfigured } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { REGISTRATION_DOCUMENT_BUCKET } from "@/server/registration-documents"
import { getActor } from "@/server/session"

const registrationId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(request: Request) {
  const actor = await getActor()
  if (!actor || !hasPermission(actor.roles, "view_registrations")) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: false }, { status: 503 })

  const url = new URL(request.url)
  const id = url.searchParams.get("registration") ?? ""
  const kind = url.searchParams.get("kind")
  if (!registrationId.test(id) || (kind !== "government-id" && kind !== "payment-proof" && kind !== "photograph")) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const admin = createAdminClient()
  const stored = kind === "government-id" ? await governmentId(admin, id) : kind === "photograph" ? await photograph(admin, id) : await paymentProof(admin, id)
  if (!stored) return NextResponse.json({ ok: false }, { status: 404 })
  const mime = mimeForRegistrationPath(stored.path)
  if (!stored.path.startsWith(`${id}/`) || !mime) return NextResponse.json({ ok: false }, { status: 404 })

  const { data, error } = await admin.storage.from(REGISTRATION_DOCUMENT_BUCKET).download(stored.path)
  if (error || !data) return NextResponse.json({ ok: false }, { status: 404 })
  const filename = stored.filename.replace(/[^\w.\- ()]/g, "") || "document"
  return new NextResponse(data, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}

async function governmentId(admin: ReturnType<typeof createAdminClient>, id: string) {
  const { data } = await admin.from("registrations").select("government_id_path, government_id_filename").eq("id", id).maybeSingle()
  if (!data?.government_id_path) return null
  return { path: data.government_id_path, filename: data.government_id_filename || "government-id" }
}

async function photograph(admin: ReturnType<typeof createAdminClient>, id: string) {
  const { data } = await admin.from("registrations").select("photograph_path, photograph_filename").eq("id", id).maybeSingle()
  if (!data?.photograph_path) return null
  return { path: data.photograph_path, filename: data.photograph_filename || "photograph" }
}

async function paymentProof(admin: ReturnType<typeof createAdminClient>, id: string) {
  const { data } = await admin
    .from("payments")
    .select("proof_path, proof_filename")
    .eq("registration_id", id)
    .not("proof_path", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data?.proof_path) return null
  return { path: data.proof_path, filename: data.proof_filename || "payment-screenshot" }
}
