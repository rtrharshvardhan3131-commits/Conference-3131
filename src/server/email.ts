import "server-only"
import { existsSync } from "node:fs"
import path from "node:path"
import nodemailer from "nodemailer"
import { formatInrFromPaise } from "@/domain/money"
import { participantRoleLabel } from "@/domain/participant-role"
import { REGISTRATION_FROM_ADDRESS, REGISTRATION_FROM_NAME, registrationMailLines, registrationMailSubject, type RegistrationMail } from "@/domain/registration-mail"
import { appUrl, isEmailConfigured } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { logServerError } from "@/server/errors"

const districtLogoPath = path.join(process.cwd(), "public", "images", "rotaract-district-3131.png")

function shell(title: string, body: string): string {
  const logo = existsSync(districtLogoPath)
    ? `<img src="cid:district-logo" alt="Rotaract District 3131" width="220" style="display:block;height:auto;border:0;margin:0 0 16px;" />`
    : ""
  return `<!doctype html><html><body style="margin:0;background:#f7f4ed;color:#101a2c;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e0d7;">
  <tr><td style="background:#101a2c;color:#c7a76c;padding:28px 32px;">
  ${logo}
  <p style="margin:0;letter-spacing:.18em;font-size:12px;">THE SOVEREIGN SUMMIT</p>
  </td></tr>
  <tr><td style="padding:32px;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#18253a;">
  <h1 style="font-family:Georgia,serif;font-weight:500;font-size:32px;margin:0 0 16px;">${title}</h1>
  ${body}
  <p style="color:#657084;font-size:13px;">Rotaract District 3131 · RIY 2026–27</p>
  </td></tr></table></td></tr></table></body></html>`
}

async function deliver(args: {
  template: string
  to: string
  subject: string
  html: string
  registrationId?: string
  campaignId?: string
}) {
  const admin = createAdminClient()
  if (args.registrationId) {
    const { data: existing } = await admin
      .from("notification_logs")
      .select("id")
      .eq("registration_id", args.registrationId)
      .eq("template", args.template)
      .eq("status", "sent")
      .maybeSingle()
    if (existing) return { status: "duplicate" as const }
  }
  if (!isEmailConfigured()) {
    await admin.from("notification_logs").insert({
      template: args.template,
      recipient: args.to,
      registration_id: args.registrationId ?? null,
      campaign_id: args.campaignId ?? null,
      status: "skipped_unconfigured",
    })
    return { status: "skipped_unconfigured" as const }
  }
  try {
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: REGISTRATION_FROM_ADDRESS, pass: process.env.GMAIL_APP_PASSWORD?.replaceAll(" ", "") },
    })
    await transport.sendMail({
      from: { name: REGISTRATION_FROM_NAME, address: REGISTRATION_FROM_ADDRESS },
      to: args.to,
      replyTo: REGISTRATION_FROM_ADDRESS,
      subject: args.subject,
      html: args.html,
      attachments: existsSync(districtLogoPath)
        ? [{ filename: "rotaract-district-3131.png", path: districtLogoPath, cid: "district-logo" }]
        : undefined,
    })
    await admin.from("notification_logs").insert({
      template: args.template,
      recipient: args.to,
      registration_id: args.registrationId ?? null,
      campaign_id: args.campaignId ?? null,
      status: "sent",
    })
    return { status: "sent" as const }
  } catch (error) {
    logServerError("email_send", error)
    await admin.from("notification_logs").insert({
      template: args.template,
      recipient: args.to,
      registration_id: args.registrationId ?? null,
      campaign_id: args.campaignId ?? null,
      status: "failed",
      error: "gmail_send_failed",
    })
    return { status: "failed" as const }
  }
}

export async function sendRegistrationEmail(mail: RegistrationMail & { registrationId: string }) {
  const lines = registrationMailLines(mail)
  const paragraphs = lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")
  await deliver({
    template: mail.kind === "confirmed" ? "registration_confirmed" : "registration_submitted",
    to: mail.email,
    registrationId: mail.registrationId,
    subject: registrationMailSubject(mail),
    html: shell(
      mail.kind === "confirmed" ? "Your place is confirmed" : "Registration received",
      `<p>Dear ${escapeHtml(mail.name)},</p>${paragraphs}<p><a href="${appUrl()}/delegate">Open the delegate portal</a></p>`,
    ),
  })
}

export function registrationMailFromRow(row: {
  kind: RegistrationMail["kind"]
  full_name: string
  email: string
  phone: string
  participant_role: string
  rotary_id: string
  tshirt_size: string
  club: string
  designation: string
  district_zone: string
  council_member: boolean
  council_position: string
  reference: string
  slab_name_snapshot: string
  amount_paise: number
}): RegistrationMail {
  return {
    kind: row.kind,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    role: participantRoleLabel(row.participant_role),
    rotaryId: row.rotary_id,
    tshirtSize: row.tshirt_size,
    club: row.club,
    designation: row.designation,
    zone: row.district_zone,
    councilMember: row.council_member,
    councilPosition: row.council_position,
    reference: row.reference,
    slabName: row.slab_name_snapshot,
    amountLabel: formatInrFromPaise(row.amount_paise),
  }
}

export async function sendEnquiryAcknowledgement(to: string, name: string) {
  await deliver({
    template: "enquiry_received",
    to,
    subject: "We have received your message",
    html: shell(
      "Message received",
      `<p>Dear ${escapeHtml(name)},</p><p>The organising committee has received your message and will reply if a contact mailbox is configured.</p>`,
    ),
  })
}

export async function sendCampaignEmail(args: {
  to: string
  subject: string
  body: string
  campaignId: string
}) {
  return deliver({
    template: "campaign",
    to: args.to,
    campaignId: args.campaignId,
    subject: args.subject,
    html: shell(escapeHtml(args.subject), `<p>${escapeHtml(args.body).replaceAll("\n", "<br/>")}</p>`),
  })
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
