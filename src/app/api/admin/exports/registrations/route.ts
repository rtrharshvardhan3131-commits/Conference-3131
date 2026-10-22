import { NextResponse } from "next/server"
import { toCsv } from "@/domain/csv"
import { formatInrFromPaise } from "@/domain/money"
import { hasPermission } from "@/domain/permissions"
import { isSupabaseConfigured } from "@/lib/env"
import { createServerSupabase } from "@/lib/supabase/server"
import { getActor } from "@/server/session"

export async function GET() {
  const actor = await getActor()
  if (!actor || !hasPermission(actor.roles, "export_registrations")) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 })
  }
  const supabase = await createServerSupabase()
  const [{ data }, { data: proofs }] = await Promise.all([
    supabase.from("registrations").select("id, reference, full_name, email, phone, club, district_zone, status, slab_name_snapshot, amount_paise, checked_in_at, created_at, government_id_path, photograph_path, rotary_id, tshirt_size, council_member, council_position, participant_role").order("created_at", { ascending: false }),
    supabase.from("payments").select("registration_id, proof_path").not("proof_path", "is", null),
  ])
  const proofIds = new Set((proofs ?? []).map((payment) => payment.registration_id))
  const csv = toCsv(
    ["reference", "name", "email", "phone", "role", "club", "zone", "rotary_id", "tshirt_size", "status", "slab", "amount", "checked_in", "government_id", "photograph", "payment_screenshot", "council_member", "council_position", "created"],
    (data ?? []).map((row) => [
      row.reference,
      row.full_name,
      row.email,
      row.phone,
      row.participant_role ?? "",
      row.club,
      row.district_zone,
      row.rotary_id ?? "",
      row.tshirt_size ?? "",
      row.status,
      row.slab_name_snapshot,
      formatInrFromPaise(row.amount_paise),
      row.checked_in_at ? "yes" : "no",
      row.government_id_path ? "yes" : "no",
      row.photograph_path ? "yes" : "no",
      proofIds.has(row.id) ? "yes" : "no",
      row.council_member ? "yes" : "no",
      row.council_position ?? "",
      row.created_at,
    ]),
  )
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=sovereign-registrations.csv",
      "Cache-Control": "private, no-store",
    },
  })
}
