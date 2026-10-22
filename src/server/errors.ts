const publicMessages: Record<string, string> = {
  "APP:duplicate_registration": "A registration for this email is already pending or confirmed.",
  "APP:capacity_reached": "Registration has reached the limit set by the organising committee.",
  "APP:slab_unavailable": "That registration slab is not open.",
  "APP:registration_closed": "Registration is not open.",
  "APP:consent_required": "Accept the conference policies before continuing.",
  "APP:amount_mismatch": "The payment amount did not match the registration. It was not confirmed.",
  "APP:registration_not_payable": "This registration can no longer accept a payment.",
  "APP:not_found": "That record could not be found.",
  "APP:rate_limited": "Too many attempts. Please wait a few minutes and try again.",
  "APP:unconfigured": "This part of the conference platform is not connected yet.",
  "APP:forbidden": "You do not have access to that action.",
  "APP:payment_unconfigured": "Online payment is not available until the district payment account is connected.",
  "APP:invalid_signature": "The payment could not be verified.",
  "APP:invalid_transition": "That change is not allowed from the current status.",
  "APP:council_position_required": "Select your council position.",
  "APP:coupon_invalid": "That code is not an open offer.",
  "APP:participant_role_required": "Select whether you are a Rotaractor, a Rotarian, or a DRR Designate.",
}

export function publicError(code: string, fallback = "The request could not be completed. Please try again."): string {
  return publicMessages[code] ?? fallback
}

export function codeFromDatabase(message: string | undefined): string | null {
  if (!message) return null
  const match = message.match(/APP:[a-z_]+/)
  return match ? match[0] : null
}

export function logServerError(scope: string, error: unknown, requestId?: string) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : undefined
  console.error(JSON.stringify({ scope, requestId, code: code ?? "unknown" }))
}
