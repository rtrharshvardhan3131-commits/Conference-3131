import { NextResponse } from "next/server"
import { deskWorkbook } from "@/domain/desk-workbook"
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
  const { data } = await supabase
    .from("registrations")
    .select("reference, full_name, phone, club, district_zone, status, slab_name_snapshot, checked_in_at, rotary_id, tshirt_size, participant_role")
    .order("club")
    .limit(5000)
  const workbook = deskWorkbook((data ?? []).map((row) => ({
    reference: row.reference,
    fullName: row.full_name,
    phone: row.phone,
    club: row.club,
    zone: row.district_zone,
    status: row.status,
    slabName: row.slab_name_snapshot,
    checkedInAt: row.checked_in_at,
    rotaryId: row.rotary_id,
    tshirtSize: row.tshirt_size,
    participantRole: row.participant_role,
  })))
  return new NextResponse(workbook, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": "attachment; filename=sovereign-registration-desk.xls",
      "Cache-Control": "private, no-store",
    },
  })
}
