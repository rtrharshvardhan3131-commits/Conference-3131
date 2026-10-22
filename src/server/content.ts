import "server-only"
import { cacheLife, cacheTag } from "next/cache"
import { initialSite } from "@/content/initial-site"
import type { FieldRequirements, PublicSite } from "@/domain/public-site"
import { isSupabaseConfigured, supabaseUrl } from "@/lib/env"
import { createPublicClient } from "@/lib/supabase/public"
import { logServerError } from "@/server/errors"

function requirements(value: unknown): FieldRequirements {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  return {
    designation: source.designation === true,
    districtZone: source.districtZone === true,
    emergencyContact: source.emergencyContact !== false,
    dietary: source.dietary !== false,
    accommodation: source.accommodation !== false,
  }
}

function assetUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith("http")) return path
  return `${supabaseUrl()}/storage/v1/object/public/public-assets/${path}`
}

async function loadSite(): Promise<PublicSite> {
  if (!isSupabaseConfigured()) return initialSite
  const supabase = createPublicClient()
  const [settings, venue, pages, highlights, slabs, faqs, sessions, speakers, tiers, sponsors, announcements] =
    await Promise.all([
      supabase.from("event_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("venue_public").select("*").maybeSingle(),
      supabase.from("site_pages").select("slug, title, summary, body").eq("status", "published"),
      supabase.from("highlights").select("title, detail, sort_order").eq("status", "published").order("sort_order"),
      supabase.from("registration_slabs").select("*").eq("status", "published").order("sort_order"),
      supabase.from("faqs").select("id, category, question, answer, sort_order").eq("status", "published").order("sort_order"),
      supabase.from("agenda_sessions").select("id, title, description, session_date, starts_at, ends_at, location, category, sort_order, speaker_id").eq("status", "published").order("session_date").order("sort_order"),
      supabase.from("speakers").select("id, name, designation, organization, biography, photo_path, links").eq("status", "published"),
      supabase.from("sponsor_tiers").select("id, name, sort_order").order("sort_order"),
      supabase.from("sponsors").select("id, tier_id, name, description, website, logo_path, sort_order").eq("status", "published").order("sort_order"),
      supabase.from("announcements").select("id, title, body, publish_at").eq("status", "published").eq("audience", "public").order("publish_at", { ascending: false }),
    ])

  const firstError = [settings, venue, pages, highlights, slabs, faqs, sessions, speakers, tiers, sponsors, announcements].find(
    (result) => result.error,
  )
  if (firstError?.error || !settings.data) {
    logServerError("public_site", firstError?.error)
    return { ...initialSite, unavailable: true }
  }

  const speakerNames = new Map((speakers.data ?? []).map((speaker) => [speaker.id, speaker.name]))
  const pageMap: PublicSite["pages"] = {}
  for (const page of pages.data ?? []) {
    pageMap[page.slug] = page
  }

  const social = Array.isArray(settings.data.social_links) ? settings.data.social_links : []

  return {
    configured: true,
    event: {
      name: settings.data.event_name,
      subtitle: settings.data.subtitle,
      rotaractYear: settings.data.rotaract_year,
      districtName: settings.data.district_name,
      hostClub: settings.data.host_club,
      startDate: settings.data.starts_on,
      endDate: settings.data.ends_on,
      timezone: settings.data.timezone,
      durationLabel: settings.data.duration_label,
      tagline: settings.data.tagline,
      planningAttendance: settings.data.planning_attendance ?? 0,
      registrationOpen: settings.data.registration_open,
      publicEmail: settings.data.public_email,
      publicPhone: settings.data.public_phone,
      policyVersion: settings.data.policy_version,
      paymentReviewNote: settings.data.payment_review_note || initialSite.event.paymentReviewNote,
      speakersTargetNote: settings.data.speakers_target_note || null,
      sponsorsTargetNote: settings.data.sponsors_target_note || null,
      venueTargetNote: settings.data.venue_target_note || null,
      fieldRequirements: requirements(settings.data.field_requirements),
      socialLinks: social.flatMap((item: unknown) => {
        if (!item || typeof item !== "object") return []
        const record = item as Record<string, unknown>
        if (typeof record.label !== "string" || typeof record.url !== "string") return []
        if (!record.url.startsWith("https://")) return []
        return [{ label: record.label, url: record.url }]
      }),
    },
    venue: {
      status: venue.data?.status === "published" ? "published" : "pending_approval",
      region: venue.data?.region ?? initialSite.venue.region,
      name: venue.data?.name ?? null,
      address: venue.data?.address ?? null,
      mapUrl: venue.data?.map_url ?? null,
      accommodation: venue.data?.accommodation ?? null,
      checkIn: venue.data?.check_in_notes ?? null,
      meals: venue.data?.meal_notes ?? null,
      transport: venue.data?.transport_notes ?? null,
      parking: venue.data?.parking_notes ?? null,
      accessibility: venue.data?.accessibility_notes ?? null,
      guidelines: venue.data?.guidelines ?? null,
    },
    pages: pageMap,
    highlights: (highlights.data ?? []).map((item) => ({ title: item.title, detail: item.detail })),
    slabs: (slabs.data ?? []).map((slab) => ({
      id: slab.id,
      name: slab.name,
      description: slab.description,
      benefits: slab.benefits ?? [],
      pricePaise: slab.price_paise,
      startsAt: slab.starts_at,
      endsAt: slab.ends_at,
      quantityLimit: slab.quantity_limit,
      quantitySold: 0,
      sortOrder: slab.sort_order,
    })),
    faqs: (faqs.data ?? []).map((faq) => ({
      id: faq.id,
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
    })),
    sessions: (sessions.data ?? []).map((session) => ({
      id: session.id,
      title: session.title,
      description: session.description,
      sessionDate: session.session_date,
      startsAt: String(session.starts_at).slice(0, 5),
      endsAt: String(session.ends_at).slice(0, 5),
      speakerName: session.speaker_id ? speakerNames.get(session.speaker_id) ?? null : null,
      location: session.location,
      category: session.category,
      sortOrder: session.sort_order,
    })),
    speakers: (speakers.data ?? []).flatMap((speaker) => {
      if (!speaker.designation || !speaker.biography || !speaker.photo_path) return []
      const links = Array.isArray(speaker.links) ? speaker.links : []
      return [
        {
          id: speaker.id,
          name: speaker.name,
          designation: speaker.designation,
          organization: speaker.organization,
          biography: speaker.biography,
          photoUrl: assetUrl(speaker.photo_path),
          sessionTitle: null,
          links: links.flatMap((link: unknown) => {
            if (!link || typeof link !== "object") return []
            const record = link as Record<string, unknown>
            if (typeof record.label !== "string" || typeof record.url !== "string" || !record.url.startsWith("https://")) {
              return []
            }
            return [{ label: record.label, url: record.url }]
          }),
        },
      ]
    }),
    sponsorTiers: (tiers.data ?? []).map((tier) => ({
      id: tier.id,
      name: tier.name,
      sponsors: (sponsors.data ?? [])
        .filter((sponsor) => sponsor.tier_id === tier.id && sponsor.logo_path)
        .map((sponsor) => ({
          id: sponsor.id,
          name: sponsor.name,
          description: sponsor.description,
          website: sponsor.website,
          logoUrl: assetUrl(sponsor.logo_path),
        })),
    })),
    announcements: (announcements.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      publishAt: item.publish_at ?? "",
    })),
    unavailable: false,
  }
}

export async function getCachedPublicSite(): Promise<PublicSite> {
  "use cache"
  cacheTag("site-content")
  try {
    const site = await loadSite()
    if (site.unavailable) cacheLife("minutes")
    else cacheLife("hours")
    return site
  } catch (error) {
    logServerError("public_site", error)
    cacheLife("minutes")
    return { ...initialSite, unavailable: true }
  }
}
