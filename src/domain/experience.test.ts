import { describe, expect, it } from "vitest"
import {
  eventCalendar,
  nextSlabDeadline,
  registrationStage,
  showPriceOnHome,
  showSocialProof,
  suggestEmail,
  uploadNeedsCompression,
  whatsAppChatUrl,
  whatsAppShareUrl,
  withReviewFaqs,
  type DeadlineSlab,
} from "@/domain/experience"

const slabs: DeadlineSlab[] = [
  { name: "Early Bird", startsAt: "2026-10-01T00:00:00+05:30", endsAt: "2026-11-30T23:59:59+05:30", sortOrder: 1, status: "published" },
  { name: "Slab 1", startsAt: "2026-12-01T00:00:00+05:30", endsAt: "2026-12-31T23:59:59+05:30", sortOrder: 2, status: "published" },
]

describe("public experience helpers", () => {
  it("counts down to the open slab end, then to the next slab", () => {
    const duringEarly = nextSlabDeadline(slabs, new Date("2026-11-01T10:00:00+05:30").getTime())
    expect(duringEarly).toMatchObject({ name: "Early Bird", kind: "ends" })
    const afterEarly = nextSlabDeadline(slabs, new Date("2026-12-02T10:00:00+05:30").getTime())
    expect(afterEarly).toMatchObject({ name: "Slab 1", kind: "ends" })
    const before = nextSlabDeadline(slabs, new Date("2026-09-01T10:00:00+05:30").getTime())
    expect(before).toMatchObject({ name: "Early Bird", kind: "opens" })
    expect(nextSlabDeadline(slabs, new Date("2027-01-02T10:00:00+05:30").getTime())).toBeNull()
  })

  it("suggests a corrected email domain and ignores a normal address", () => {
    expect(suggestEmail("ada@gmial.com")).toBe("ada@gmail.com")
    expect(suggestEmail("ada@gmail.com")).toBeNull()
  })

  it("builds a WhatsApp share link and a chat link only for a real number", () => {
    expect(whatsAppShareUrl("Join us https://summit.example")).toBe("https://wa.me/?text=Join%20us%20https%3A%2F%2Fsummit.example")
    expect(whatsAppChatUrl("+91 83906 62266")).toBe("https://wa.me/918390662266")
    expect(whatsAppChatUrl("")).toBeNull()
  })

  it("hides social proof below 25 and the homepage price unless the flag is true", () => {
    expect(showSocialProof(24)).toBe(false)
    expect(showSocialProof(25)).toBe(true)
    expect(showPriceOnHome(undefined)).toBe(false)
    expect(showPriceOnHome("false")).toBe(false)
    expect(showPriceOnHome("true")).toBe(true)
  })

  it("compresses large images and leaves PDFs alone", () => {
    expect(uploadNeedsCompression("image/jpeg", 2_000_000)).toBe(true)
    expect(uploadNeedsCompression("image/jpeg", 200_000)).toBe(false)
    expect(uploadNeedsCompression("application/pdf", 2_000_000)).toBe(false)
  })

  it("keeps an unconfirmed registration out of the confirmed stage", () => {
    expect(registrationStage("pending_payment")).toBe("review")
    expect(registrationStage("confirmed")).toBe("confirmed")
    expect(registrationStage("cancelled")).toBe("closed")
  })

  it("creates an all-day calendar file that ends the day after the conference", () => {
    const ics = eventCalendar({
      name: "The SOVEREIGN Summit",
      startDate: "2027-02-13",
      endDate: "2027-02-14",
      description: "Venue to be announced.",
      stamp: "20261022T000000Z",
    })
    expect(ics).toContain("DTSTART;VALUE=DATE:20270213")
    expect(ics).toContain("DTEND;VALUE=DATE:20270215")
    expect(ics).not.toContain("Lonavala")
  })

  it("adds a to-be-announced answer only when a topic is missing", () => {
    const faqs = withReviewFaqs([{ id: "1", category: "Payment", question: "How is payment collected?", answer: "Transfer, then upload a screenshot." }])
    expect(faqs.some((faq) => faq.question === "How does payment work?")).toBe(false)
    expect(faqs.find((faq) => faq.question === "What is the dress code?")?.answer).toBe("To be announced.")
  })
})
