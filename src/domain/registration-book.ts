import { pricesMatch } from "@/domain/money"
import { decidePaymentConfirmation } from "@/domain/payments"
import { quoteSlab } from "@/domain/slabs"
import { canTransitionRegistration, registrationHoldsSeat } from "@/domain/status"
import type { HeldRegistration, RegistrationSlab, RegistrationStatus } from "@/domain/types"

const HOLD_MINUTES = 30

export type BookState = {
  registrations: HeldRegistration[]
  registrationOpen: boolean
  registrationLimit: number | null
}

export type RegistrationRequest = {
  id: string
  email: string
  slabId: string
  clientAmountPaise?: number
  acceptedPolicies: boolean
  now: Date
}

export type BookResult =
  | { ok: true; state: BookState; registration: HeldRegistration }
  | { ok: false; state: BookState; code: string }

function holdExpiry(createdAt: string, now: Date): boolean {
  return now.getTime() - new Date(createdAt).getTime() > HOLD_MINUTES * 60 * 1000
}

export function releaseExpiredHolds(state: BookState, now: Date): BookState {
  return {
    ...state,
    registrations: state.registrations.map((registration) => {
      if (registration.status === "pending_payment" && holdExpiry(registration.createdAt, now)) {
        return { ...registration, status: "cancelled" as const }
      }
      return registration
    }),
  }
}

function seatsUsed(registrations: readonly HeldRegistration[]): number {
  return registrations.filter((registration) => registrationHoldsSeat(registration.status)).length
}

export function requestRegistration(
  state: BookState,
  slabs: readonly RegistrationSlab[],
  request: RegistrationRequest,
): BookResult {
  const released = releaseExpiredHolds(state, request.now)
  if (!request.acceptedPolicies) return { ok: false, state: released, code: "consent_required" }
  if (!released.registrationOpen) return { ok: false, state: released, code: "registration_closed" }

  const email = request.email.trim().toLowerCase()
  const duplicate = released.registrations.some(
    (registration) => registration.email === email && registrationHoldsSeat(registration.status),
  )
  if (duplicate) return { ok: false, state: released, code: "duplicate_registration" }

  if (released.registrationLimit !== null && seatsUsed(released.registrations) >= released.registrationLimit) {
    return { ok: false, state: released, code: "capacity_reached" }
  }

  const slab = slabs.find((item) => item.id === request.slabId)
  if (!slab) return { ok: false, state: released, code: "slab_unavailable" }
  const sold = released.registrations.filter(
    (registration) => registration.slabId === slab.id && registrationHoldsSeat(registration.status),
  ).length
  const quote = quoteSlab({ ...slab, quantitySold: sold }, request.now)
  if ("error" in quote) return { ok: false, state: released, code: quote.error }

  if (request.clientAmountPaise !== undefined && !pricesMatch(quote.amountPaise, request.clientAmountPaise)) {
    // The supplied figure is ignored. The stored amount always comes from the slab.
  }

  const registration: HeldRegistration = {
    id: request.id,
    email,
    status: "pending_payment",
    slabId: slab.id,
    amountPaise: quote.amountPaise,
    createdAt: request.now.toISOString(),
  }
  return { ok: true, state: { ...released, registrations: [...released.registrations, registration] }, registration }
}

export function applyVerifiedPayment(
  state: BookState,
  registrationId: string,
  input: { signatureValid: boolean; paidPaise: number },
): { ok: true; state: BookState; idempotent: boolean } | { ok: false; code: string } {
  const current = state.registrations.find((registration) => registration.id === registrationId)
  if (!current) return { ok: false, code: "not_found" }
  const decision = decidePaymentConfirmation({
    signatureValid: input.signatureValid,
    amountMatches: pricesMatch(current.amountPaise, input.paidPaise),
    alreadyCaptured: current.status === "confirmed",
    registrationStatus: current.status,
  })
  if (!decision.confirm) return { ok: false, code: decision.reason }
  if (!canTransitionRegistration(current.status, "confirmed") && current.status !== "confirmed") {
    return { ok: false, code: "invalid_transition" }
  }
  return {
    ok: true,
    idempotent: decision.idempotent,
    state: {
      ...state,
      registrations: state.registrations.map((registration) =>
        registration.id === registrationId ? { ...registration, status: "confirmed" as RegistrationStatus } : registration,
      ),
    },
  }
}

export function applyFailedPayment(state: BookState, registrationId: string): BookState {
  return {
    ...state,
    registrations: state.registrations.map((registration) => {
      if (registration.id !== registrationId || registration.status !== "pending_payment") return registration
      return { ...registration, status: "payment_failed" }
    }),
  }
}
