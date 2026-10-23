import { AdminShell } from "@/components/admin/shell"

export const instant = false

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
