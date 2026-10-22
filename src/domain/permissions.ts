import type { AppRole, Permission } from "@/domain/types"

const grants: Record<Permission, readonly AppRole[]> = {
  manage_users: ["super_admin"],
  manage_settings: ["super_admin"],
  manage_slabs: ["super_admin", "district_admin"],
  manage_content: ["super_admin", "district_admin", "content_editor"],
  view_registrations: ["super_admin", "district_admin", "finance_admin", "registration_admin"],
  edit_registrations: ["super_admin", "district_admin", "registration_admin"],
  check_in: ["super_admin", "district_admin", "registration_admin"],
  view_payments: ["super_admin", "district_admin", "finance_admin", "registration_admin"],
  reconcile_payments: ["super_admin", "finance_admin"],
  review_refunds: ["super_admin", "finance_admin"],
  export_finance: ["super_admin", "finance_admin"],
  export_registrations: ["super_admin", "district_admin", "finance_admin", "registration_admin"],
  view_reports: ["super_admin", "district_admin", "finance_admin", "registration_admin"],
  view_audit: ["super_admin", "district_admin"],
  send_communications: ["super_admin", "district_admin"],
  review_enquiries: ["super_admin", "district_admin", "registration_admin"],
}

export function hasPermission(roles: readonly AppRole[], permission: Permission): boolean {
  const allowed = grants[permission]
  return roles.some((role) => allowed.includes(role))
}

export function isStaff(roles: readonly AppRole[]): boolean {
  return roles.some((role) => role !== "delegate")
}

export function staffNavigation(roles: readonly AppRole[]): { href: string; label: string }[] {
  const items: { href: string; label: string; permission: Permission }[] = [
    { href: "/admin", label: "Overview", permission: "view_reports" },
    { href: "/admin/registrations", label: "Registrations", permission: "view_registrations" },
    { href: "/admin/check-in", label: "Check-in", permission: "check_in" },
    { href: "/admin/payments", label: "Payments", permission: "view_payments" },
    { href: "/admin/slabs", label: "Slabs", permission: "manage_slabs" },
    { href: "/admin/offers", label: "Offers", permission: "manage_slabs" },
    { href: "/admin/agenda", label: "Agenda", permission: "manage_content" },
    { href: "/admin/speakers", label: "Speakers", permission: "manage_content" },
    { href: "/admin/sponsors", label: "Sponsors", permission: "manage_content" },
    { href: "/admin/venue", label: "Venue", permission: "manage_content" },
    { href: "/admin/announcements", label: "Announcements", permission: "manage_content" },
    { href: "/admin/communications", label: "Communications", permission: "send_communications" },
    { href: "/admin/content", label: "Content", permission: "manage_content" },
    { href: "/admin/enquiries", label: "Enquiries", permission: "review_enquiries" },
    { href: "/admin/reports", label: "Reports", permission: "view_reports" },
    { href: "/admin/audit-logs", label: "Audit log", permission: "view_audit" },
    { href: "/admin/settings", label: "Settings", permission: "manage_settings" },
  ]
  return items.filter((item) => hasPermission(roles, item.permission)).map(({ href, label }) => ({ href, label }))
}
