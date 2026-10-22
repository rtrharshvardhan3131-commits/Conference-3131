import type { PaymentStatus, RegistrationStatus } from "@/domain/types"

const registrationTransitions: Record<RegistrationStatus, readonly RegistrationStatus[]> = {
  draft: ["pending_payment", "cancelled"],
  pending_payment: ["confirmed", "payment_failed", "cancelled"],
  payment_failed: ["pending_payment", "cancelled"],
  confirmed: ["refund_pending"],
  refund_pending: ["refunded", "confirmed"],
  refunded: [],
  cancelled: [],
}

const paymentTransitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
  created: ["pending", "failed", "cancelled", "captured"],
  pending: ["authorized", "captured", "failed", "cancelled"],
  authorized: ["captured", "failed", "cancelled"],
  captured: ["refund_pending", "partially_refunded", "refunded"],
  refund_pending: ["refunded", "partially_refunded", "captured"],
  partially_refunded: ["refunded"],
  failed: [],
  cancelled: [],
  refunded: [],
}

export function canTransitionRegistration(from: RegistrationStatus, to: RegistrationStatus): boolean {
  return from === to || registrationTransitions[from].includes(to)
}

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return from === to || paymentTransitions[from].includes(to)
}

export function registrationHoldsSeat(status: RegistrationStatus): boolean {
  return status === "pending_payment" || status === "confirmed" || status === "refund_pending"
}
