import { Suspense } from "react"
import { AdminShell } from "@/components/admin/shell"

export const instant = false

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8">Loading administration…</p>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  )
}
