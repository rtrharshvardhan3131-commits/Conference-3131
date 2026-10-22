export type FieldRequirements = {
  designation: boolean
  districtZone: boolean
  emergencyContact: boolean
  dietary: boolean
  accommodation: boolean
}

export type PublicEvent = {
  name: string
  subtitle: string
  rotaractYear: string
  districtName: string
  hostClub: string
  startDate: string
  endDate: string
  timezone: string
  durationLabel: string
  tagline: string
  planningAttendance: number
  registrationOpen: boolean
  publicEmail: string | null
  publicPhone: string | null
  policyVersion: string
  fieldRequirements: FieldRequirements
  socialLinks: { label: string; url: string }[]
  paymentReviewNote: string
  speakersTargetNote: string | null
  sponsorsTargetNote: string | null
  venueTargetNote: string | null
}

export type PublicVenue = {
  status: "pending_approval" | "published"
  region: string
  name: string | null
  address: string | null
  mapUrl: string | null
  accommodation: string | null
  checkIn: string | null
  meals: string | null
  transport: string | null
  parking: string | null
  accessibility: string | null
  guidelines: string | null
}

export type PublicPage = { slug: string; title: string; summary: string; body: string }

export type PublicSlab = {
  id: string
  name: string
  description: string
  benefits: string[]
  pricePaise: number
  startsAt: string
  endsAt: string
  quantityLimit: number | null
  quantitySold: number
  sortOrder: number
}

export type PublicFaq = { id: string; category: string; question: string; answer: string }
export type PublicSession = {
  id: string
  title: string
  description: string
  sessionDate: string
  startsAt: string
  endsAt: string
  speakerName: string | null
  location: string | null
  category: string
  sortOrder: number
}
export type PublicSpeaker = {
  id: string
  name: string
  designation: string
  organization: string | null
  biography: string
  photoUrl: string | null
  sessionTitle: string | null
  links: { label: string; url: string }[]
}
export type PublicSponsorTier = {
  id: string
  name: string
  sponsors: {
    id: string
    name: string
    description: string | null
    website: string | null
    logoUrl: string | null
  }[]
}
export type PublicAnnouncement = { id: string; title: string; body: string; publishAt: string }

export type PublicSite = {
  configured: boolean
  unavailable: boolean
  event: PublicEvent
  venue: PublicVenue
  pages: Record<string, PublicPage>
  highlights: { title: string; detail: string }[]
  slabs: PublicSlab[]
  faqs: PublicFaq[]
  sessions: PublicSession[]
  speakers: PublicSpeaker[]
  sponsorTiers: PublicSponsorTier[]
  announcements: PublicAnnouncement[]
}
