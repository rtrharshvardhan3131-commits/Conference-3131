export const registrationStatuses = [
  "draft",
  "pending_payment",
  "confirmed",
  "payment_failed",
  "cancelled",
  "refund_pending",
  "refunded",
] as const

export type RegistrationStatus = (typeof registrationStatuses)[number]

export const paymentStatuses = [
  "created",
  "pending",
  "authorized",
  "captured",
  "failed",
  "cancelled",
  "refund_pending",
  "partially_refunded",
  "refunded",
] as const

export type PaymentStatus = (typeof paymentStatuses)[number]

export const appRoles = [
  "super_admin",
  "district_admin",
  "finance_admin",
  "registration_admin",
  "content_editor",
  "delegate",
] as const

export type AppRole = (typeof appRoles)[number]

export const permissions = [
  "manage_users",
  "manage_settings",
  "manage_slabs",
  "manage_content",
  "view_registrations",
  "edit_registrations",
  "check_in",
  "view_payments",
  "reconcile_payments",
  "review_refunds",
  "export_finance",
  "export_registrations",
  "view_reports",
  "view_audit",
  "send_communications",
  "review_enquiries",
] as const

export type Permission = (typeof permissions)[number]

export type RegistrationSlab = {
  id: string
  name: string
  description: string
  benefits: string[]
  pricePaise: number
  startsAt: string
  endsAt: string
  quantityLimit: number | null
  quantitySold: number
  status: "draft" | "published" | "archived"
  sortOrder: number
}

export type HeldRegistration = {
  id: string
  email: string
  status: RegistrationStatus
  slabId: string
  amountPaise: number
  createdAt: string
}
