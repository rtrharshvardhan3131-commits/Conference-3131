import "server-only"
import { isSupabaseConfigured } from "@/lib/env"
import { createServerSupabase } from "@/lib/supabase/server"

export type MonitorRow = {
  id: string
  reference: string
  fullName: string
  email: string
  phone: string
  club: string
  status: string
  slabName: string
  amountPaise: number
  createdAt: string
  checkedInAt: string | null
  dietary: string
  accommodation: string
  roomNumber: string
  roommateName: string
  roomNote: string
  designation: string
  districtZone: string
  emergencyContactName: string
  emergencyContactPhone: string
  governmentIdOnFile: boolean
  paymentProofOnFile: boolean
  councilPosition: string
  participantRole: string
}

export type MonitorSnapshot = {
  rows: MonitorRow[]
  collectedPaise: number
}

export async function loadMonitor(): Promise<MonitorSnapshot> {
  if (!isSupabaseConfigured()) return { rows: [], collectedPaise: 0 }
  const supabase = await createServerSupabase()
  const [{ data }, { data: payments }] = await Promise.all([
    supabase
      .from("registrations")
      .select("id, reference, full_name, email, phone, club, status, slab_name_snapshot, amount_paise, created_at, checked_in_at, dietary_preference, accommodation_preference, room_number, roommate_name, room_note, designation, district_zone, emergency_contact_name, emergency_contact_phone, government_id_path, council_position, participant_role")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("payments").select("registration_id, status, amount_paise, reconciliation_status, provider, proof_path"),
  ])
  const proofs = new Set((payments ?? []).filter((payment) => payment.proof_path).map((payment) => payment.registration_id))
  const collectedPaise = (payments ?? [])
    .filter((payment) => payment.status === "captured" && payment.reconciliation_status !== "simulated" && payment.provider !== "simulation")
    .reduce((sum, payment) => sum + payment.amount_paise, 0)
  const rows: MonitorRow[] = (data ?? []).map((row) => ({
    id: row.id,
    reference: row.reference,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? "",
    club: row.club ?? "",
    status: row.status,
    slabName: row.slab_name_snapshot ?? "",
    amountPaise: row.amount_paise,
    createdAt: row.created_at,
    checkedInAt: row.checked_in_at,
    dietary: row.dietary_preference ?? "",
    accommodation: row.accommodation_preference ?? "",
    roomNumber: row.room_number ?? "",
    roommateName: row.roommate_name ?? "",
    roomNote: row.room_note ?? "",
    designation: row.designation ?? "",
    districtZone: row.district_zone ?? "",
    emergencyContactName: row.emergency_contact_name ?? "",
    emergencyContactPhone: row.emergency_contact_phone ?? "",
    governmentIdOnFile: Boolean(row.government_id_path),
    paymentProofOnFile: proofs.has(row.id),
    councilPosition: row.council_position ?? "",
    participantRole: row.participant_role ?? "",
  }))
  return { rows, collectedPaise }
}

export function filterMonitor(rows: MonitorRow[], query: string, status: string) {
  const needle = query.trim().toLowerCase()
  return rows.filter((row) => {
    if (status && row.status !== status) return false
    if (!needle) return true
    return [row.fullName, row.email, row.phone, row.reference, row.club].some((value) => value.toLowerCase().includes(needle))
  })
}

export function monitorTotals(rows: MonitorRow[]) {
  const count = (status: string) => rows.filter((row) => row.status === status).length
  return {
    total: rows.length,
    confirmed: count("confirmed"),
    pending: count("pending_payment"),
    failed: count("payment_failed"),
    refunds: count("refund_pending") + count("refunded"),
    checkedIn: rows.filter((row) => row.checkedInAt).length,
    clubs: new Set(rows.map((row) => row.club).filter(Boolean)).size,
    quotedPaise: rows.reduce((sum, row) => sum + row.amountPaise, 0),
  }
}
