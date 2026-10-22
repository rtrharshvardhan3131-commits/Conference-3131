import { describe, expect, it } from "vitest"
import { COUNCIL_POSITIONS } from "@/domain/council-positions"
import { toCsv } from "@/domain/csv"
import { inspectRegistrationDocument, safeDownloadName } from "@/domain/documents"
import { formatInrFromPaise, pricesMatch, rupeesToPaise } from "@/domain/money"
import { clientPaymentReportIsIgnored, decidePaymentConfirmation } from "@/domain/payments"
import { hasPermission } from "@/domain/permissions"
import { applyFailedPayment, applyVerifiedPayment, requestRegistration } from "@/domain/registration-book"
import { ROTARACT_CLUBS } from "@/domain/clubs"
import { fieldRequirementsMet, registrationDetailsSchema } from "@/domain/schemas"
import { quoteCoupon, type StoredCoupon } from "@/domain/coupons"
import { activeSlabs, firstRegistrationSlab, quoteSlab } from "@/domain/slabs"
import { overlappingSessionIds, sessionTimeValid } from "@/domain/sessions"
import { canTransitionPayment, canTransitionRegistration } from "@/domain/status"
import type { RegistrationSlab } from "@/domain/types"
import { registrationMailLines, registrationMailSubject, REGISTRATION_FROM_ADDRESS } from "@/domain/registration-mail"
import { decideWebhookDelivery } from "@/domain/webhooks"
import { formClubName, matchDistrictMembers } from "@/domain/district-members"

const early: RegistrationSlab = {
  id: "early",
  name: "Early Bird",
  description: "Provisional early registration",
  benefits: ["Delegate registration"],
  pricePaise: 180000,
  startsAt: "2026-10-01T00:00:00+05:30",
  endsAt: "2026-11-30T23:59:59+05:30",
  quantityLimit: 2,
  quantitySold: 0,
  status: "published",
  sortOrder: 1,
}

const baseState = { registrations: [], registrationOpen: true, registrationLimit: 2 }

describe("registration documents", () => {
  it("accepts a JPEG, PNG, WEBP, or PDF and rejects anything else", () => {
    expect(inspectRegistrationDocument(Uint8Array.of(0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0))?.extension).toBe("jpg")
    expect(inspectRegistrationDocument(Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0))?.extension).toBe("png")
    const webp = Uint8Array.of(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50)
    expect(inspectRegistrationDocument(webp)?.mime).toBe("image/webp")
    expect(inspectRegistrationDocument(Uint8Array.of(0x25, 0x50, 0x44, 0x46, 0, 0, 0, 0, 0, 0, 0, 0))?.extension).toBe("pdf")
    expect(inspectRegistrationDocument(Uint8Array.of(0x4d, 0x5a, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0))).toBeNull()
  })

  it("keeps the download name free of path characters", () => {
    expect(safeDownloadName("../../id.png", "jpg")).toBe("id.jpg")
    expect(safeDownloadName("", "pdf")).toBe("document.pdf")
  })
})

describe("money", () => {
  it("stores rupees as integer paise", () => {
    expect(rupeesToPaise(2299)).toBe(229900)
    expect(formatInrFromPaise(180000)).toContain("1,800")
    expect(pricesMatch(180000, 180000)).toBe(true)
    expect(pricesMatch(180000, 180001)).toBe(false)
  })
})

describe("coupons", () => {
  const now = new Date("2026-10-15T12:00:00+05:30")
  const offer = (patch: Partial<StoredCoupon> = {}): StoredCoupon => ({
    code: "SUMMIT10",
    name: "Summit 10",
    kind: "percent",
    percent: 10,
    amountPaise: null,
    status: "published",
    startsAt: null,
    endsAt: null,
    quantityLimit: null,
    quantityUsed: 0,
    ...patch,
  })

  it("reduces the slab fee by a published percent or fixed offer", () => {
    expect(quoteCoupon(180000, offer(), now)).toEqual({
      ok: true,
      code: "SUMMIT10",
      name: "Summit 10",
      discountPaise: 18000,
      amountPaise: 162000,
    })
    expect(quoteCoupon(180000, offer({ kind: "amount", percent: null, amountPaise: 50000, name: "Flat 500" }), now)).toMatchObject({
      ok: true,
      discountPaise: 50000,
      amountPaise: 130000,
    })
  })

  it("rejects an offer that is closed, exhausted, or would remove the fee", () => {
    expect(quoteCoupon(180000, offer({ status: "draft" }), now).ok).toBe(false)
    expect(quoteCoupon(180000, offer({ endsAt: "2026-10-01T00:00:00+05:30" }), now).ok).toBe(false)
    expect(quoteCoupon(180000, offer({ startsAt: "2026-11-01T00:00:00+05:30" }), now).ok).toBe(false)
    expect(quoteCoupon(180000, offer({ quantityLimit: 2, quantityUsed: 2 }), now).ok).toBe(false)
    expect(quoteCoupon(180000, offer({ percent: 100 }), now).ok).toBe(false)
    expect(quoteCoupon(180000, offer({ kind: "amount", percent: null, amountPaise: 180000 }), now).ok).toBe(false)
  })
})

describe("slabs", () => {
  const now = new Date("2026-10-14T10:00:00+05:30")

  it("quotes only the database price for an open slab", () => {
    expect(quoteSlab(early, now)).toEqual({ amountPaise: 180000 })
    expect(activeSlabs([early, { ...early, id: "draft", status: "draft" }], now).map((slab) => slab.id)).toEqual(["early"])
  })

  it("rejects an expired or sold-out slab", () => {
    expect(quoteSlab(early, new Date("2026-12-01T00:00:00+05:30"))).toEqual({ error: "slab_unavailable" })
    expect(firstRegistrationSlab([
      { ...early, id: "later", sortOrder: 2, pricePaise: 229900 },
      early,
    ])?.id).toBe("early")
    expect(quoteSlab({ ...early, quantitySold: 2 }, now)).toEqual({ error: "slab_unavailable" })
  })
})

describe("registration book", () => {
  const now = new Date("2026-10-14T10:00:00+05:30")

  it("creates a pending registration at the slab price and ignores a client price", () => {
    const result = requestRegistration(baseState, [early], {
      id: "r1",
      email: "Ada@Club.test",
      slabId: "early",
      clientAmountPaise: 100,
      acceptedPolicies: true,
      now,
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.registration.amountPaise).toBe(180000)
  })

  it("blocks duplicates, missing consent, and capacity", () => {
    const first = requestRegistration(baseState, [early], {
      id: "r1",
      email: "ada@club.test",
      slabId: "early",
      acceptedPolicies: true,
      now,
    })
    if (!first.ok) throw new Error(first.code)
    const duplicate = requestRegistration(first.state, [early], {
      id: "r2",
      email: "ada@club.test",
      slabId: "early",
      acceptedPolicies: true,
      now,
    })
    expect(duplicate.ok).toBe(false)
    const second = requestRegistration(first.state, [early], {
      id: "r2",
      email: "b@club.test",
      slabId: "early",
      acceptedPolicies: true,
      now,
    })
    if (!second.ok) throw new Error(second.code)
    const third = requestRegistration(second.state, [early], {
      id: "r3",
      email: "c@club.test",
      slabId: "early",
      acceptedPolicies: true,
      now,
    })
    expect(third).toMatchObject({ ok: false, code: "capacity_reached" })
    expect(
      requestRegistration(baseState, [early], {
        id: "r4",
        email: "d@club.test",
        slabId: "early",
        acceptedPolicies: false,
        now,
      }).ok,
    ).toBe(false)
  })

  it("confirms only a verified matching payment and keeps failures unpaid", () => {
    const created = requestRegistration(baseState, [early], {
      id: "r1",
      email: "ada@club.test",
      slabId: "early",
      acceptedPolicies: true,
      now,
    })
    if (!created.ok) throw new Error("setup")
    expect(applyVerifiedPayment(created.state, "r1", { signatureValid: false, paidPaise: 180000 })).toMatchObject({
      ok: false,
      code: "invalid_signature",
    })
    expect(applyVerifiedPayment(created.state, "r1", { signatureValid: true, paidPaise: 100 })).toMatchObject({
      ok: false,
      code: "amount_mismatch",
    })
    const failed = applyFailedPayment(created.state, "r1")
    expect(failed.registrations[0]?.status).toBe("payment_failed")
    const paid = applyVerifiedPayment(created.state, "r1", { signatureValid: true, paidPaise: 180000 })
    expect(paid.ok).toBe(true)
    if (paid.ok) {
      expect(paid.state.registrations[0]?.status).toBe("confirmed")
      const again = applyVerifiedPayment(paid.state, "r1", { signatureValid: true, paidPaise: 180000 })
      expect(again).toMatchObject({ ok: true, idempotent: true })
    }
    expect(clientPaymentReportIsIgnored()).toBe(true)
  })
})

describe("transitions, permissions, webhooks, csv, and sessions", () => {
  it("enforces registration and payment transitions", () => {
    expect(canTransitionRegistration("pending_payment", "confirmed")).toBe(true)
    expect(canTransitionRegistration("confirmed", "pending_payment")).toBe(false)
    expect(canTransitionPayment("captured", "refund_pending")).toBe(true)
    expect(canTransitionPayment("failed", "captured")).toBe(false)
  })

  it("keeps financial permissions away from content editors", () => {
    expect(hasPermission(["content_editor"], "manage_content")).toBe(true)
    expect(hasPermission(["content_editor"], "view_payments")).toBe(false)
    expect(hasPermission(["registration_admin"], "reconcile_payments")).toBe(false)
    expect(hasPermission(["finance_admin"], "export_finance")).toBe(true)
    expect(hasPermission(["delegate"], "view_registrations")).toBe(false)
  })

  it("processes a webhook once and retries only failures", () => {
    expect(decideWebhookDelivery(null)).toBe("process")
    expect(decideWebhookDelivery({ processingStatus: "processed" })).toBe("skip")
    expect(decideWebhookDelivery({ processingStatus: "processing" })).toBe("skip")
    expect(decideWebhookDelivery({ processingStatus: "failed" })).toBe("retry")
  })

  it("neutralises spreadsheet formulas", () => {
    expect(toCsv(["name"], [["=cmd"], ["Ada"]])).toContain("'=cmd")
  })

  it("flags overlapping sessions in the same room", () => {
    expect(sessionTimeValid("09:00", "10:00")).toBe(true)
    expect(
      overlappingSessionIds([
        { id: "a", sessionDate: "2027-02-13", startsAt: "09:00", endsAt: "10:00", location: "Hall" },
        { id: "b", sessionDate: "2027-02-13", startsAt: "09:30", endsAt: "11:00", location: "Hall" },
        { id: "c", sessionDate: "2027-02-13", startsAt: "09:30", endsAt: "11:00", location: "Lawn" },
      ]),
    ).toEqual(["a", "b"])
  })

  it("requires configured mandatory fields", () => {
    const parsed = registrationDetailsSchema.parse({
      fullName: "Ada Lovelace",
      email: "Ada@Example.com",
      phone: "+91 98765 43210",
      participantRole: "rotaractor",
      club: "Rotaract Club of Bavdhan Pioneers",
      designation: "President",
      districtZone: "Zone 1",
      rotaryId: "RID3131",
      tshirtSize: "M",
    })
    expect(parsed.email).toBe("ada@example.com")
    expect(ROTARACT_CLUBS).toHaveLength(103)
    expect(registrationDetailsSchema.safeParse({ ...parsed, club: "Another club" }).success).toBe(false)
    expect(registrationDetailsSchema.safeParse({ ...parsed, participantRole: "guest" }).success).toBe(false)
    expect(registrationDetailsSchema.safeParse({ ...parsed, participantRole: "drr_designate" }).success).toBe(true)
    expect(parsed.participantRole).toBe("rotaractor")
    expect(registrationDetailsSchema.safeParse({ ...parsed, districtZone: "Zone 4" }).success).toBe(true)
    expect(registrationDetailsSchema.safeParse({ ...parsed, districtZone: "North" }).success).toBe(false)
    expect(registrationDetailsSchema.safeParse({ ...parsed, designation: "" }).success).toBe(false)
    expect(registrationDetailsSchema.safeParse({ ...parsed, districtZone: "" }).success).toBe(false)
    expect(registrationDetailsSchema.safeParse({ ...parsed, rotaryId: "12" }).success).toBe(false)
    expect(registrationDetailsSchema.safeParse({ ...parsed, tshirtSize: "Youth" }).success).toBe(false)
    expect(registrationDetailsSchema.safeParse({ ...parsed, councilMember: true, councilPosition: "" }).success).toBe(false)
    expect(COUNCIL_POSITIONS).toHaveLength(39)
    expect(registrationDetailsSchema.safeParse({ ...parsed, councilMember: true, councilPosition: "Secretary" }).success).toBe(false)
    expect(registrationDetailsSchema.safeParse({ ...parsed, councilMember: true, councilPosition: "District Treasurer" }).success).toBe(true)
    expect(
      fieldRequirementsMet(parsed, {
        designation: false,
        districtZone: false,
        emergencyContact: true,
        dietary: false,
        accommodation: false,
      }),
    ).toMatch(/Emergency/)
  })

  it("includes the registration details in the participant email", () => {
    const mail = {
      kind: "submitted" as const,
      name: "Asha Rao",
      email: "asha@example.com",
      phone: "9876543210",
      role: "Rotaractor",
      rotaryId: "RID3131",
      tshirtSize: "M",
      club: "Rotaract Club of AIT",
      designation: "President",
      zone: "Zone 1",
      councilMember: true,
      councilPosition: "District Treasurer",
      reference: "RID3131",
      slabName: "Early Bird",
      amountLabel: "₹1,800",
    }
    expect(REGISTRATION_FROM_ADDRESS).toBe("rtr.harshvardhan3131@gmail.com")
    expect(registrationMailSubject(mail)).toBe("Registration received · RID3131")
    const lines = registrationMailLines(mail).join("\n")
    expect(lines).toContain("Rotary ID: RID3131")
    expect(lines).not.toContain("Reference:")
    expect(lines).toContain("T-shirt size: M")
    expect(lines).toContain("Rotaract Club of AIT")
    expect(lines).toContain("District Treasurer")
    expect(lines).toContain("Early Bird")
    expect(lines).toContain("confirmed only after the finance team verifies the payment")
    expect(registrationMailSubject({ ...mail, kind: "confirmed" })).toBe("Registration confirmed · RID3131")
    const withPassword = registrationMailLines({ ...mail, loginPassword: "SummitPass12", loginUrl: "http://localhost:3000/login" }).join("\n")
    expect(withPassword).toContain("Password: SummitPass12")
    expect(withPassword).toContain("This password stays the same.")
    expect(registrationMailLines({ ...mail, kind: "confirmed", loginPassword: "SummitPass12", loginUrl: "http://localhost:3000/login" }).join("\n")).not.toContain("Password:")
  })

  it("prefills one district member and refuses a shared Rotary ID", () => {
    const rows = [
      { fullName: "Asha Kale", rotaryId: "12345678", club: "Rotaract Club of Roar NIBM", zone: "Zone 2" },
      { fullName: "First", rotaryId: "11835327", club: "Rotaract Club of Khopoli", zone: "Zone 1" },
      { fullName: "Second", rotaryId: "11835327", club: "Rotaract Club of Khopoli", zone: "Zone 1" },
    ]
    expect(formClubName("Rotaract Club of Symbiosis Law Viman Nagar")).toBe("Rotaract Club of Symboisis Law Viman Nagar")
    expect(formClubName("Rotaract Club of Nigdi Pune")).toBe("Rotaract Club of Nigdi-Pune")
    expect(matchDistrictMembers(rows, " 1234 5678 ")).toEqual({
      status: "one",
      fullName: "Asha Kale",
      club: "Rotaract Club of ROAR NIBM",
      zone: "Zone 2",
      participantRole: "rotaractor",
    })
    expect(matchDistrictMembers(rows, "11835327").status).toBe("many")
    expect(matchDistrictMembers(rows, "00000000").status).toBe("none")
    expect(matchDistrictMembers(rows, "12").status).toBe("skipped")
  })

  it("rejects a browser success flag as proof of payment", () => {
    const decision = decidePaymentConfirmation({
      signatureValid: false,
      amountMatches: true,
      alreadyCaptured: false,
      registrationStatus: "pending_payment",
    })
    expect(decision).toEqual({ confirm: false, reason: "invalid_signature" })
  })
})
