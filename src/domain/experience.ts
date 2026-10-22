export type DeadlineSlab = {
  name: string
  startsAt: string
  endsAt: string
  sortOrder: number
  status?: "draft" | "published" | "archived"
}

export type SlabDeadline = {
  name: string
  target: number
  kind: "ends" | "opens"
}

const EMAIL_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "hotmal.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "yahooo.com": "yahoo.com",
  "yaho.com": "yahoo.com",
}

export const IMAGE_UPLOAD_TARGET_BYTES = 1_572_864
export const SOCIAL_PROOF_THRESHOLD = 25

export function nextSlabDeadline(slabs: readonly DeadlineSlab[], now: number): SlabDeadline | null {
  const published = slabs.filter((slab) => slab.status === undefined || slab.status === "published")
  const open = published
    .filter((slab) => {
      const start = new Date(slab.startsAt).getTime()
      const end = new Date(slab.endsAt).getTime()
      return !Number.isNaN(start) && !Number.isNaN(end) && now >= start && now <= end
    })
    .sort((left, right) => new Date(left.endsAt).getTime() - new Date(right.endsAt).getTime() || left.sortOrder - right.sortOrder)[0]
  if (open) return { name: open.name, target: new Date(open.endsAt).getTime(), kind: "ends" }

  const upcoming = published
    .filter((slab) => new Date(slab.startsAt).getTime() > now)
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime() || left.sortOrder - right.sortOrder)[0]
  if (upcoming) return { name: upcoming.name, target: new Date(upcoming.startsAt).getTime(), kind: "opens" }
  return null
}

export function suggestEmail(value: string): string | null {
  const match = /^([^@\s]+)@([^@\s]+)$/.exec(value.trim().toLowerCase())
  if (!match?.[1] || !match[2]) return null
  const domain = EMAIL_TYPOS[match[2]]
  if (!domain) return null
  return `${match[1]}@${domain}`
}

export function whatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

export function whatsAppChatUrl(phone: string): string | null {
  const digits = phone.replace(/\D/g, "")
  if (digits.length < 10) return null
  return `https://wa.me/${digits}`
}

export function showSocialProof(delegates: number, threshold = SOCIAL_PROOF_THRESHOLD): boolean {
  return Number.isInteger(delegates) && delegates >= threshold
}

export function showPriceOnHome(flag: string | undefined): boolean {
  return flag === "true"
}

export function uploadNeedsCompression(mime: string, bytes: number): boolean {
  if (mime === "application/pdf" || !mime.startsWith("image/")) return false
  return bytes > IMAGE_UPLOAD_TARGET_BYTES
}

export function registrationStage(status: string): "review" | "confirmed" | "closed" {
  if (status === "confirmed") return "confirmed"
  if (status === "cancelled" || status === "refunded" || status === "refund_pending") return "closed"
  return "review"
}

function icsDate(day: string): string {
  return day.replaceAll("-", "")
}

function addDay(day: string): string {
  const [year, month, date] = day.split("-").map(Number)
  const next = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1))
  next.setUTCDate(next.getUTCDate() + 1)
  return next.toISOString().slice(0, 10)
}

export function eventCalendar(input: { name: string; startDate: string; endDate: string; description: string; stamp: string }): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The SOVEREIGN Summit//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:sovereign-summit-2027@rotaract3131",
    `DTSTAMP:${input.stamp}`,
    `DTSTART;VALUE=DATE:${icsDate(input.startDate)}`,
    `DTEND;VALUE=DATE:${icsDate(addDay(input.endDate))}`,
    `SUMMARY:${input.name}`,
    `DESCRIPTION:${input.description.replaceAll("\n", "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
  return lines.join("\r\n")
}

const FAQ_TOPICS: { id: string; category: string; question: string; match: RegExp }[] = [
  { id: "topic-attend", category: "Registration", question: "Who can attend?", match: /who can attend|rotaractor|rotarian/i },
  { id: "topic-included", category: "Registration", question: "What is included?", match: /included|souvenir|meals/i },
  { id: "topic-stay", category: "Accommodation", question: "Where will delegates stay?", match: /stay|accommodation/i },
  { id: "topic-refund", category: "Refunds", question: "Can I cancel or ask for a refund?", match: /refund|cancel/i },
  { id: "topic-payment", category: "Payment", question: "How does payment work?", match: /payment/i },
  { id: "topic-transport", category: "Travel", question: "Is there transport from Pune?", match: /transport|travel/i },
  { id: "topic-dress", category: "Guidelines", question: "What is the dress code?", match: /dress/i },
  { id: "topic-contact", category: "Contact", question: "Who do I contact?", match: /contact/i },
]

export function withReviewFaqs<T extends { id: string; category: string; question: string; answer: string }>(published: readonly T[]): Array<T | { id: string; category: string; question: string; answer: string }> {
  const missing = FAQ_TOPICS.filter((topic) => !published.some((faq) => topic.match.test(faq.question) || topic.match.test(faq.answer)))
  return [
    ...published,
    ...missing.map((topic) => ({
      id: topic.id,
      category: topic.category,
      question: topic.question,
      answer: "To be announced.",
    })),
  ]
}
