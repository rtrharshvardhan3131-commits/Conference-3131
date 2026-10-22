import Link from "next/link"
import { formatInrFromPaise } from "@/domain/money"
import { participantRoleLabel } from "@/domain/participant-role"
import type { MonitorRow } from "@/server/registration-monitor"

export function statusLabel(status: string) {
  return status.replaceAll("_", " ")
}

export function StatusChip({ status }: { status: string }) {
  const tone = status === "confirmed"
    ? "bg-gold/20 text-navy"
    : status === "pending_payment"
      ? "bg-ivory text-ink"
      : status === "payment_failed" || status === "cancelled"
        ? "bg-red-50 text-red-900"
        : "bg-paper text-slate"
  return <span className={`inline-flex min-h-8 items-center px-2.5 text-xs capitalize ${tone}`}>{statusLabel(status)}</span>
}

export function RegistrationRows({ rows }: { rows: MonitorRow[] }) {
  if (rows.length === 0) return <p className="border border-line bg-paper px-5 py-8 text-slate">No registrations match.</p>
  return (
    <>
      <div className="hidden overflow-x-auto border border-line bg-paper md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-[0.68rem] tracking-[0.14em] text-gold uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Rotary ID</th>
              <th className="px-4 py-3 font-semibold">Delegate</th>
              <th className="px-4 py-3 font-semibold">Club</th>
              <th className="px-4 py-3 font-semibold">Slab</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">Proof</th>
              <th className="px-4 py-3 font-semibold">Desk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-b-0">
                <td className="px-4 py-4"><Link className="font-semibold underline decoration-gold underline-offset-4" href={`/admin/registrations/${row.id}`}>{row.reference}</Link></td>
                <td className="px-4 py-4">{row.fullName}<br /><span className="text-slate">{participantRoleLabel(row.participantRole)} · {row.email}</span>{row.councilPosition ? <><br /><span className="text-slate">Council · {row.councilPosition}</span></> : null}</td>
                <td className="px-4 py-4">{row.club}</td>
                <td className="px-4 py-4">{row.slabName}</td>
                <td className="px-4 py-4">{formatInrFromPaise(row.amountPaise)}</td>
                <td className="px-4 py-4"><StatusChip status={row.status} /></td>
                <td className="px-4 py-4">{row.governmentIdOnFile ? "On file" : "Missing"}</td>
                <td className="px-4 py-4">{row.paymentProofOnFile ? "On file" : "—"}</td>
                <td className="px-4 py-4">{row.checkedInAt ? "Checked in" : "Not in"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="border border-line bg-paper px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <Link className="font-semibold underline decoration-gold underline-offset-4" href={`/admin/registrations/${row.id}`}>{row.reference}</Link>
              <StatusChip status={row.status} />
            </div>
            <p className="mt-2 font-serif text-2xl text-navy">{row.fullName}</p>
            <p className="text-sm text-slate">{participantRoleLabel(row.participantRole)}</p>
            <p className="text-sm text-slate">{row.email}</p>
            {row.councilPosition ? <p className="text-sm text-slate">Council · {row.councilPosition}</p> : null}
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-[0.68rem] tracking-[0.14em] text-gold uppercase">Club</dt><dd>{row.club}</dd></div>
              <div><dt className="text-[0.68rem] tracking-[0.14em] text-gold uppercase">Slab</dt><dd>{row.slabName}</dd></div>
              <div><dt className="text-[0.68rem] tracking-[0.14em] text-gold uppercase">Amount</dt><dd>{formatInrFromPaise(row.amountPaise)}</dd></div>
              <div><dt className="text-[0.68rem] tracking-[0.14em] text-gold uppercase">ID</dt><dd>{row.governmentIdOnFile ? "On file" : "Missing"}</dd></div>
              <div><dt className="text-[0.68rem] tracking-[0.14em] text-gold uppercase">Proof</dt><dd>{row.paymentProofOnFile ? "On file" : "—"}</dd></div>
              <div><dt className="text-[0.68rem] tracking-[0.14em] text-gold uppercase">Desk</dt><dd>{row.checkedInAt ? "Checked in" : "Not in"}</dd></div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}
