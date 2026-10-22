import { NextResponse } from "next/server"
import { toCsv } from "@/domain/csv"
import { formatInrFromPaise } from "@/domain/money"
import { hasPermission } from "@/domain/permissions"
import { isSupabaseConfigured } from "@/lib/env"
import { createServerSupabase } from "@/lib/supabase/server"
import { getActor } from "@/server/session"

export async function GET() {
  const actor = await getActor()
  if (!actor || !hasPermission(actor.roles, "export_finance")) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }
  if (!isSupabaseConfigured()) {
    return new NextResponse("payment_id,registration_id,provider,order_id,payment_id_provider,amount,status,reconciliation,method,created,verified\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=sovereign-payments.csv",
        "Cache-Control": "private, no-store",
      },
    })
  }
  const supabase = await createServerSupabase()
  const { data } = await supabase.from("payments").select("id, registration_id, provider, provider_order_id, provider_payment_id, amount_paise, status, reconciliation_status, method, created_at, verified_at").order("created_at", { ascending: false })
  const csv = toCsv(
    ["payment_id", "registration_id", "provider", "order_id", "payment_id_provider", "amount", "status", "reconciliation", "method", "created", "verified"],
    (data ?? []).map((row) => [
      row.id,
      row.registration_id,
      row.provider,
      row.provider_order_id,
      row.provider_payment_id,
      formatInrFromPaise(row.amount_paise),
      row.status,
      row.reconciliation_status,
      row.method,
      row.created_at,
      row.verified_at,
    ]),
  )
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=sovereign-payments.csv",
      "Cache-Control": "private, no-store",
    },
  })
}
