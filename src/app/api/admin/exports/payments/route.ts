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
    return new NextResponse("payment_id,registration_id,provider,payment_method,order_id,payment_id_provider,txnid,easepayid,amount,status,reconciliation,method,created,verified\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=sovereign-payments.csv",
        "Cache-Control": "private, no-store",
      },
    })
  }
  const supabase = await createServerSupabase()
  const { data } = await supabase
    .from("payments")
    .select("id, registration_id, provider, payment_method, provider_order_id, provider_payment_id, amount_paise, status, reconciliation_status, method, created_at, verified_at")
    .order("created_at", { ascending: false })
  const registrationIds = [...new Set((data ?? []).map((row) => row.registration_id))]
  const { data: attempts } = registrationIds.length === 0
    ? { data: [] }
    : await supabase
      .from("payment_attempts")
      .select("registration_id, txnid, easepayid, created_at")
      .in("registration_id", registrationIds)
      .order("created_at", { ascending: false })
  const latestAttempt = new Map<string, { txnid: string; easepayid: string | null }>()
  for (const attempt of attempts ?? []) {
    if (!latestAttempt.has(attempt.registration_id)) {
      latestAttempt.set(attempt.registration_id, { txnid: attempt.txnid, easepayid: attempt.easepayid })
    }
  }
  const csv = toCsv(
    ["payment_id", "registration_id", "provider", "payment_method", "order_id", "payment_id_provider", "txnid", "easepayid", "amount", "status", "reconciliation", "method", "created", "verified"],
    (data ?? []).map((row) => {
      const attempt = latestAttempt.get(row.registration_id)
      return [
        row.id,
        row.registration_id,
        row.provider,
        row.payment_method,
        row.provider_order_id,
        row.provider_payment_id,
        row.provider_order_id || attempt?.txnid || "",
        row.provider_payment_id || attempt?.easepayid || "",
        formatInrFromPaise(row.amount_paise),
        row.status,
        row.reconciliation_status,
        row.method,
        row.created_at,
        row.verified_at,
      ]
    }),
  )
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=sovereign-payments.csv",
      "Cache-Control": "private, no-store",
    },
  })
}
