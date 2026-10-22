export type ConfirmationInput = {
  signatureValid: boolean
  amountMatches: boolean
  alreadyCaptured: boolean
  registrationStatus: "pending_payment" | "confirmed" | "payment_failed" | "cancelled" | "refund_pending" | "refunded" | "draft"
}

export type ConfirmationDecision =
  | { confirm: true; idempotent: boolean }
  | { confirm: false; reason: "invalid_signature" | "amount_mismatch" | "registration_not_payable" }

export function decidePaymentConfirmation(input: ConfirmationInput): ConfirmationDecision {
  if (!input.signatureValid) return { confirm: false, reason: "invalid_signature" }
  if (!input.amountMatches) return { confirm: false, reason: "amount_mismatch" }
  if (input.alreadyCaptured || input.registrationStatus === "confirmed") {
    return { confirm: true, idempotent: true }
  }
  if (input.registrationStatus !== "pending_payment" && input.registrationStatus !== "payment_failed") {
    return { confirm: false, reason: "registration_not_payable" }
  }
  return { confirm: true, idempotent: false }
}

export function clientPaymentReportIsIgnored(): true {
  return true
}
