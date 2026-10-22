"use server"

import { updateTag, revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isDistrictClub } from "@/domain/clubs"
import { normalizeRotaryId } from "@/domain/district-members"
import { isTshirtSize } from "@/domain/tshirt"
import { couponCodeIsWellFormed, normalizeCouponCode } from "@/domain/coupons"
import { isDistrictZone } from "@/domain/zones"
import { hasPermission } from "@/domain/permissions"
import type { Permission } from "@/domain/types"
import { sessionTimeValid } from "@/domain/sessions"
import { rupeesToPaise } from "@/domain/money"
import { canTransitionRegistration } from "@/domain/status"
import { createAdminClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/server/session"
import { confirmCapturedPayment } from "@/server/checkout"
import { sendCampaignEmail } from "@/server/email"
import { logServerError } from "@/server/errors"

async function audit(actorId: string, action: string, entityType: string, entityId: string | null, metadata: Record<string, unknown>) {
  const admin = createAdminClient()
  await admin.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  })
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

async function guard(permission: Permission) {
  return requirePermission(permission)
}

export async function saveSettings(formData: FormData) {
  const actor = await guard("manage_settings")
  const admin = createAdminClient()
  const { error } = await admin.from("event_settings").update({
    event_name: text(formData, "event_name"),
    subtitle: text(formData, "subtitle"),
    tagline: text(formData, "tagline"),
    registration_open: formData.get("registration_open") === "on",
    public_email: text(formData, "public_email") || null,
    public_phone: text(formData, "public_phone") || null,
    policy_version: text(formData, "policy_version"),
    field_requirements: {
      designation: true,
      districtZone: true,
      emergencyContact: formData.get("emergencyContact") === "on",
      dietary: formData.get("dietary") === "on",
      accommodation: formData.get("accommodation") === "on",
    },
  }).eq("id", 1)
  if (error) return
  await admin.from("event_settings").update({
    payment_review_note: text(formData, "payment_review_note") || null,
    speakers_target_note: text(formData, "speakers_target_note") || null,
    sponsors_target_note: text(formData, "sponsors_target_note") || null,
    venue_target_note: text(formData, "venue_target_note") || null,
  }).eq("id", 1)
  const limit = text(formData, "registration_limit")
  if (hasPermission(actor.roles, "manage_settings")) {
    await admin.from("event_operations").update({
      registration_limit: limit ? Number(limit) : null,
      budget_ceiling_paise: text(formData, "budget_rupees") ? rupeesToPaise(Number(text(formData, "budget_rupees"))) : null,
    }).eq("id", 1)
  }
  await audit(actor.id, "settings.update", "event_settings", "1", { registration_open: formData.get("registration_open") === "on" })
  updateTag("site-content")
}

export async function saveVenue(formData: FormData) {
  const actor = await guard("manage_content")
  const status = text(formData, "status") === "published" ? "published" : "pending_approval"
  const name = text(formData, "name") || null
  const address = text(formData, "address") || null
  if (status === "published" && (!name || !address)) return
  const admin = createAdminClient()
  await admin.from("venue_details").update({
    status,
    region: text(formData, "region"),
    name,
    address,
    map_url: text(formData, "map_url") || null,
    accommodation: text(formData, "accommodation") || null,
    check_in_notes: text(formData, "check_in_notes") || null,
    meal_notes: text(formData, "meal_notes") || null,
    transport_notes: text(formData, "transport_notes") || null,
    parking_notes: text(formData, "parking_notes") || null,
    accessibility_notes: text(formData, "accessibility_notes") || null,
    guidelines: text(formData, "guidelines") || null,
  }).eq("id", 1)
  await audit(actor.id, "venue.update", "venue_details", "1", { status })
  updateTag("site-content")
}

export async function saveSlab(formData: FormData) {
  const actor = await guard("manage_slabs")
  const admin = createAdminClient()
  const payload = {
    name: text(formData, "name"),
    description: text(formData, "description"),
    benefits: text(formData, "benefits").split("\n").map((item) => item.trim()).filter(Boolean),
    price_paise: rupeesToPaise(Number(text(formData, "price_rupees"))),
    starts_at: new Date(text(formData, "starts_at")).toISOString(),
    ends_at: new Date(text(formData, "ends_at")).toISOString(),
    quantity_limit: text(formData, "quantity_limit") ? Number(text(formData, "quantity_limit")) : null,
    status: text(formData, "status") || "draft",
    sort_order: Number(text(formData, "sort_order") || "0"),
  }
  const id = text(formData, "id")
  if (id) await admin.from("registration_slabs").update(payload).eq("id", id)
  else await admin.from("registration_slabs").insert(payload)
  await audit(actor.id, "slab.save", "registration_slabs", id || null, { name: payload.name, price_paise: payload.price_paise })
  updateTag("site-content")
}

export async function saveSession(formData: FormData) {
  const actor = await guard("manage_content")
  const starts = text(formData, "starts_at")
  const ends = text(formData, "ends_at")
  if (!sessionTimeValid(starts, ends)) return
  const admin = createAdminClient()
  const payload = {
    title: text(formData, "title"),
    description: text(formData, "description"),
    session_date: text(formData, "session_date"),
    starts_at: starts,
    ends_at: ends,
    location: text(formData, "location") || null,
    category: text(formData, "category") || "Session",
    sort_order: Number(text(formData, "sort_order") || "0"),
    status: text(formData, "status") || "draft",
    speaker_id: text(formData, "speaker_id") || null,
  }
  const id = text(formData, "id")
  if (id) await admin.from("agenda_sessions").update(payload).eq("id", id)
  else await admin.from("agenda_sessions").insert(payload)
  await audit(actor.id, "agenda.save", "agenda_sessions", id || null, { title: payload.title, status: payload.status })
  updateTag("site-content")
}

export async function deleteSession(formData: FormData) {
  const actor = await guard("manage_content")
  const id = text(formData, "id")
  const admin = createAdminClient()
  await admin.from("agenda_sessions").delete().eq("id", id)
  await audit(actor.id, "agenda.delete", "agenda_sessions", id, {})
  updateTag("site-content")
}

export async function saveSpeaker(formData: FormData) {
  const actor = await guard("manage_content")
  const admin = createAdminClient()
  const id = text(formData, "id")
  let photoPath = text(formData, "photo_path") || null
  const file = formData.get("photo")
  if (file instanceof File && file.size > 0) {
    if (file.size > 2_000_000 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
    photoPath = `speakers/${crypto.randomUUID()}.${extension}`
    const bytes = new Uint8Array(await file.arrayBuffer())
    const { error } = await admin.storage.from("public-assets").upload(photoPath, bytes, { contentType: file.type, upsert: false })
    if (error) return
  }
  const status = text(formData, "status") || "draft"
  const name = text(formData, "name")
  const designation = text(formData, "designation")
  const biography = text(formData, "biography")
  if (status === "published" && (!name || !designation || !biography || !photoPath)) return
  const payload = {
    name,
    designation,
    organization: text(formData, "organization") || null,
    biography,
    photo_path: photoPath,
    status,
    sort_order: Number(text(formData, "sort_order") || "0"),
  }
  if (id) await admin.from("speakers").update(payload).eq("id", id)
  else await admin.from("speakers").insert(payload)
  await audit(actor.id, "speaker.save", "speakers", id || null, { name, status })
  updateTag("site-content")
}

export async function saveSponsor(formData: FormData) {
  const actor = await guard("manage_content")
  const admin = createAdminClient()
  const id = text(formData, "id")
  let logoPath = text(formData, "logo_path") || null
  const file = formData.get("logo")
  if (file instanceof File && file.size > 0) {
    if (file.size > 2_000_000 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
    logoPath = `sponsors/${crypto.randomUUID()}.${extension}`
    const bytes = new Uint8Array(await file.arrayBuffer())
    const { error } = await admin.storage.from("public-assets").upload(logoPath, bytes, { contentType: file.type })
    if (error) return
  }
  const status = text(formData, "status") || "draft"
  if (status === "published" && (!text(formData, "name") || !logoPath)) return
  const payload = {
    tier_id: text(formData, "tier_id"),
    name: text(formData, "name"),
    description: text(formData, "description") || null,
    website: text(formData, "website") || null,
    logo_path: logoPath,
    status,
    sort_order: Number(text(formData, "sort_order") || "0"),
  }
  if (id) await admin.from("sponsors").update(payload).eq("id", id)
  else await admin.from("sponsors").insert(payload)
  await audit(actor.id, "sponsor.save", "sponsors", id || null, { name: payload.name, status })
  updateTag("site-content")
}

export async function savePage(formData: FormData) {
  const actor = await guard("manage_content")
  const admin = createAdminClient()
  const slug = text(formData, "slug")
  await admin.from("site_pages").upsert({
    slug,
    title: text(formData, "title"),
    summary: text(formData, "summary"),
    body: text(formData, "body"),
    status: text(formData, "status") || "draft",
  })
  await audit(actor.id, "page.save", "site_pages", slug, { status: text(formData, "status") })
  updateTag("site-content")
}

export async function saveFaq(formData: FormData) {
  const actor = await guard("manage_content")
  const admin = createAdminClient()
  const payload = {
    category: text(formData, "category"),
    question: text(formData, "question"),
    answer: text(formData, "answer"),
    sort_order: Number(text(formData, "sort_order") || "0"),
    status: text(formData, "status") || "draft",
  }
  const id = text(formData, "id")
  if (id) await admin.from("faqs").update(payload).eq("id", id)
  else await admin.from("faqs").insert(payload)
  await audit(actor.id, "faq.save", "faqs", id || null, { question: payload.question })
  updateTag("site-content")
}

export async function saveAnnouncement(formData: FormData) {
  const actor = await guard("manage_content")
  const admin = createAdminClient()
  const payload = {
    title: text(formData, "title"),
    body: text(formData, "body"),
    audience: text(formData, "audience") || "public",
    status: text(formData, "status") || "draft",
    publish_at: text(formData, "publish_at") ? new Date(text(formData, "publish_at")).toISOString() : null,
  }
  const id = text(formData, "id")
  if (id) await admin.from("announcements").update(payload).eq("id", id)
  else await admin.from("announcements").insert(payload)
  await audit(actor.id, "announcement.save", "announcements", id || null, { title: payload.title, status: payload.status })
  updateTag("site-content")
}

export async function correctRegistration(formData: FormData) {
  await guard("edit_registrations")
  const id = text(formData, "id")
  const admin = createAdminClient()
  const club = text(formData, "club")
  const zone = text(formData, "district_zone")
  const { data: current } = await admin.from("registrations").select("club, district_zone").eq("id", id).maybeSingle()
  if (!isDistrictClub(club) && current?.club !== club) return
  if (!text(formData, "designation") || !isDistrictZone(zone)) return
  const rotaryId = text(formData, "rotary_id")
  const tshirtSize = text(formData, "tshirt_size")
  if (rotaryId && (rotaryId.length < 4 || !/^[A-Za-z0-9][A-Za-z0-9 -]*$/.test(rotaryId))) return
  if (tshirtSize && !isTshirtSize(tshirtSize)) return
  const patch = {
    full_name: text(formData, "full_name"),
    phone: text(formData, "phone"),
    club,
    designation: text(formData, "designation"),
    district_zone: zone,
    rotary_id: rotaryId,
    tshirt_size: tshirtSize,
    dietary_preference: text(formData, "dietary_preference"),
    accommodation_preference: text(formData, "accommodation_preference"),
    emergency_contact_name: text(formData, "emergency_contact_name"),
    emergency_contact_phone: text(formData, "emergency_contact_phone"),
  }
  const actor = await guard("edit_registrations")
  await admin.from("registrations").update(patch).eq("id", id)
  await audit(actor.id, "registration.correct", "registrations", id, { fields: Object.keys(patch) })
  revalidatePath("/admin/registrations")
}

export async function assignRoom(formData: FormData) {
  const id = text(formData, "id")
  const roomNumber = text(formData, "room_number")
  const roommateName = text(formData, "roommate_name")
  const roomNote = text(formData, "room_note")
  const actor = await guard("edit_registrations")
  const admin = createAdminClient()
  await admin.from("registrations").update({
    room_number: roomNumber || null,
    roommate_name: roommateName || null,
    room_note: roomNote || null,
  }).eq("id", id)
  await audit(actor.id, "registration.room", "registrations", id, { room_number: roomNumber })
  revalidatePath(`/admin/registrations/${id}`)
  revalidatePath("/delegate/room")
}

export async function checkIn(formData: FormData) {
  const actor = await guard("check_in")
  const reference = normalizeRotaryId(text(formData, "reference")).toUpperCase()
  const exception = text(formData, "exception_reason")
  const back = (notice: string): never => {
    redirect(`/admin/check-in?notice=${notice}&reference=${encodeURIComponent(reference)}`)
  }
  const admin = createAdminClient()
  const { data } = await admin.from("registrations").select("id, status, checked_in_at").eq("reference", reference).maybeSingle()
  if (!data) {
    back("missing")
    return
  }
  if (data.checked_in_at) {
    back("already")
    return
  }
  if (data.status !== "confirmed" && exception.length < 8) {
    back("exception")
    return
  }
  await admin.from("registrations").update({
    checked_in_at: new Date().toISOString(),
    checked_in_by: actor.id,
    check_in_exception_reason: data.status === "confirmed" ? null : exception,
  }).eq("id", data.id)
  await audit(actor.id, "registration.check_in", "registrations", data.id, {
    exception: data.status !== "confirmed",
    status: data.status,
  })
  revalidatePath("/admin/check-in")
  back("checked-in")
}

export async function approveManualPayment(formData: FormData) {
  const actor = await guard("reconcile_payments")
  const paymentId = text(formData, "payment_id")
  const admin = createAdminClient()
  const { data: payment } = await admin.from("payments").select("id, provider, amount_paise, status").eq("id", paymentId).maybeSingle()
  if (!payment || payment.provider !== "manual" || payment.status === "captured") {
    revalidatePath("/admin/payments")
    redirect("/admin/payments")
  }
  await confirmCapturedPayment({
    paymentId: payment.id,
    orderId: null,
    providerPaymentId: null,
    amountPaise: payment.amount_paise,
    method: "manual",
    signatureValid: true,
    reconciliation: "manually_verified",
  })
  await audit(actor.id, "payment.manual_verify", "payments", payment.id, { reason: "Screenshot reviewed" })
  revalidatePath("/admin/payments")
  revalidatePath("/admin")
  revalidatePath("/admin/registrations")
  redirect("/admin/payments")
}

export async function requestRefund(formData: FormData) {
  const actor = await guard("review_refunds")
  const admin = createAdminClient()
  const paymentId = text(formData, "payment_id")
  const reason = text(formData, "reason")
  const { data: payment } = await admin.from("payments").select("id, registration_id, amount_paise, status, provider, provider_payment_id").eq("id", paymentId).maybeSingle()
  if (!payment || payment.status !== "captured") return
  const { data: registration } = await admin.from("registrations").select("status").eq("id", payment.registration_id).maybeSingle()
  if (!registration || !canTransitionRegistration(registration.status, "refund_pending")) return
  await admin.from("registrations").update({ status: "refund_pending" }).eq("id", payment.registration_id)
  await admin.from("payments").update({ status: "refund_pending" }).eq("id", payment.id)
  const { data: refund } = await admin.from("refunds").insert({
    payment_id: payment.id,
    registration_id: payment.registration_id,
    amount_paise: payment.amount_paise,
    reason,
    requested_by: actor.id,
    status: "requested",
  }).select("id").single()
  if (payment.provider === "razorpay" && payment.provider_payment_id && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const response = await fetch(`https://api.razorpay.com/v1/payments/${payment.provider_payment_id}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: payment.amount_paise }),
    })
    if (response.ok) {
      const body = (await response.json()) as { id?: string }
      await admin.from("refunds").update({ status: "refunded", provider_refund_id: body.id ?? null, decided_by: actor.id }).eq("id", refund?.id)
      await admin.from("payments").update({ status: "refunded" }).eq("id", payment.id)
      await admin.from("registrations").update({ status: "refunded" }).eq("id", payment.registration_id)
    } else {
      logServerError("refund_provider", { code: response.status })
      await admin.from("refunds").update({ status: "failed" }).eq("id", refund?.id)
    }
  }
  await audit(actor.id, "refund.request", "refunds", refund?.id ?? null, { payment_id: payment.id })
}

export async function assignRole(formData: FormData) {
  const actor = await guard("manage_users")
  const email = text(formData, "email").toLowerCase()
  const role = text(formData, "role")
  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle()
  if (!profile) return
  await admin.from("user_roles").upsert({ user_id: profile.id, role }, { onConflict: "user_id,role" })
  await audit(actor.id, "role.assign", "user_roles", profile.id, { role })
}

export async function updateEnquiry(formData: FormData) {
  const actor = await guard("review_enquiries")
  const admin = createAdminClient()
  const id = text(formData, "id")
  await admin.from("support_enquiries").update({ status: text(formData, "status") }).eq("id", id)
  await audit(actor.id, "enquiry.update", "support_enquiries", id, { status: text(formData, "status") })
}

export async function sendCampaign(formData: FormData) {
  const actor = await guard("send_communications")
  if (formData.get("confirm") !== "on") return
  const admin = createAdminClient()
  const audience = text(formData, "audience")
  const title = text(formData, "title")
  const body = text(formData, "body")
  let emails: string[] = []
  if (audience === "confirmed") {
    const { data } = await admin.from("registrations").select("email").eq("status", "confirmed")
    emails = (data ?? []).map((row) => row.email)
  }
  const unique = [...new Set(emails)]
  const { data: campaign } = await admin.from("notification_campaigns").insert({
    title,
    body,
    audience,
    recipient_count: unique.length,
    created_by: actor.id,
  }).select("id").single()
  let sent = 0
  let failed = 0
  for (const email of unique) {
    const result = await sendCampaignEmail({ to: email, subject: title, body, campaignId: campaign?.id ?? "" })
    if (result.status === "sent") sent += 1
    else failed += 1
  }
  if (campaign) await admin.from("notification_campaigns").update({ sent_count: sent, failed_count: failed }).eq("id", campaign.id)
  await audit(actor.id, "campaign.send", "notification_campaigns", campaign?.id ?? null, { recipient_count: unique.length, sent, failed })
}

export async function saveCoupon(formData: FormData) {
  const actor = await guard("manage_slabs")
  const code = normalizeCouponCode(text(formData, "code"))
  const name = text(formData, "name")
  const kind = text(formData, "kind") === "amount" ? "amount" : "percent"
  const raw = Number(text(formData, "value"))
  const status = text(formData, "status") || "draft"
  if (!couponCodeIsWellFormed(code) || name.length < 2 || !["draft", "published", "archived"].includes(status)) return
  if (kind === "percent" && (!Number.isInteger(raw) || raw < 1 || raw > 100)) return
  const starts = text(formData, "starts_at")
  const ends = text(formData, "ends_at")
  const quantity = text(formData, "quantity_limit")
  const payload = {
    code,
    name,
    kind,
    percent: kind === "percent" ? raw : null,
    value_paise: kind === "amount" ? rupeesToPaise(raw) : null,
    starts_at: starts ? new Date(starts).toISOString() : null,
    ends_at: ends ? new Date(ends).toISOString() : null,
    quantity_limit: quantity ? Number(quantity) : null,
    status,
  }
  const admin = createAdminClient()
  const id = text(formData, "id")
  if (id) await admin.from("coupons").update(payload).eq("id", id)
  else await admin.from("coupons").insert(payload)
  await audit(actor.id, "coupon.save", "coupons", id || null, { code, kind, status })
  revalidatePath("/admin/offers")
}
