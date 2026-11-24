import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { connection } from "next/server"
import { RegistrationPass } from "@/components/public/registration-pass"
import { StatusTracker } from "@/components/public/status-tracker"
import { PageIntro } from "@/components/public/page-intro"
import { createAdminClient } from "@/lib/supabase/admin"
import { supabaseSecretKey } from "@/lib/env"
import { readRegistrationAccess } from "@/server/access-cookie"
import { getActor } from "@/server/session"
import { getCachedPublicSite } from "@/server/content"

export const metadata: Metadata = { title: "Registration status", robots: { index: false, follow: false } }

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <Suspense fallback={<PageIntro eyebrow="Registration" title="Checking your registration" summary="This takes a moment." />}>
      <ConfirmationBody searchParams={searchParams} />
    </Suspense>
  )
}

function noticeValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ""
  return value ?? ""
}

async function ConfirmationBody({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await connection()
  const params = await searchParams
  const notice = noticeValue(params.notice)
  if (!supabaseSecretKey()) {
    return <PageIntro eyebrow="Registration" title="Status unavailable" summary="The database is not connected, so a confirmation cannot be shown." />
  }
  const registrationId = await readRegistrationAccess()
  const actor = await getActor()
  const admin = createAdminClient()
  let query = admin.from("registrations").select("id, reference, full_name, club, status, amount_paise, slab_name_snapshot, email, user_id, government_id_path, photograph_path, payment_method").limit(1)
  if (registrationId) query = query.eq("id", registrationId)
  else if (actor) query = query.eq("user_id", actor.id).order("created_at", { ascending: false })
  else {
    return <PageIntro eyebrow="Registration" title="Sign in to view your status" summary="A confirmation is shown only to the delegate who has just paid, or after they sign in." />
  }
  const { data } = await query.maybeSingle()
  if (!data || (actor && data.user_id && data.user_id !== actor.id && !registrationId)) {
    return <PageIntro eyebrow="Registration" title="No registration was found" summary="If you just paid, return from the checkout page. Otherwise sign in with the same email." />
  }
  const confirmed = data.status === "confirmed"
  const site = await getCachedPublicSite()
  const { data: payment } = await admin.from("payments").select("proof_path, provider, payment_method, provider_order_id, provider_payment_id").eq("registration_id", data.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
  const { data: attempt } = await admin
    .from("payment_attempts")
    .select("status, txnid, easepayid")
    .eq("registration_id", data.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  const { data: mailed } = await admin.from("notification_logs").select("id").eq("registration_id", data.id).eq("status", "sent").in("template", ["registration_submitted", "registration_confirmed"]).limit(1).maybeSingle()

  const gatewayPending =
    !confirmed &&
    (data.payment_method === "gateway" || payment?.provider === "easebuzz") &&
    (attempt?.status === "initiated" || attempt?.status === "pending" || notice === "pending")

  const title = confirmed
    ? "Registration confirmed"
    : notice === "failed"
      ? "Payment not completed"
      : notice === "invalid"
        ? "Payment could not be verified"
        : "Payment not confirmed"

  const summary = confirmed
    ? "This registration is confirmed. Keep the Rotary ID for check-in."
    : gatewayPending
      ? "We are confirming the payment with the bank. This page does not mean you are registered yet."
      : "This registration is not confirmed. A browser message alone does not count as payment."

  const nextCopy = confirmed
    ? "Your place is confirmed. Keep this Rotary ID for check-in. The programme appears on the agenda page as sessions are published."
    : gatewayPending
      ? "If you closed the payment tab, leave this page open and refresh in a minute. Confirmation arrives only after Easebuzz and the bank report a successful payment."
      : payment?.provider === "manual"
        ? `${site.event.paymentReviewNote} A screenshot does not confirm the registration.`
        : "If the payment failed or was cancelled, you can return to registration and try again. A redirect alone does not confirm the place."

  return (
    <>
      <PageIntro eyebrow={data.reference} title={title} summary={summary} />
      <div className="container-summit max-w-2xl py-8 md:py-16">
        <StatusTracker status={data.status} />
        <div className="mt-6 border border-line bg-paper p-4">
          <h2 className="font-semibold text-ink">What happens next</h2>
          <p className="mt-2 text-sm text-slate">{nextCopy}</p>
          {!confirmed && attempt?.txnid ? (
            <p className="mt-2 text-sm text-slate">Payment reference {attempt.txnid}{attempt.status ? ` · ${attempt.status.replaceAll("_", " ")}` : ""}</p>
          ) : null}
        </div>
        <div className="mt-6">
        <RegistrationPass
          reference={data.reference}
          name={data.full_name}
          club={data.club || "Club not recorded"}
          slab={data.slab_name_snapshot}
          amountPaise={data.amount_paise}
          status={data.status.replaceAll("_", " ")}
          paid={confirmed}
        />
        {data.government_id_path ? <p className="mt-6 text-slate">Your government ID is on file with the organising committee.</p> : null}
        {data.photograph_path ? <p className="mt-3 text-slate">Your professional photograph is on file with the organising committee.</p> : null}
        {payment?.proof_path ? <p className="mt-3 text-slate">Your payment screenshot is with the finance team. It does not confirm this registration.</p> : null}
        {mailed ? <p className="mt-3 text-slate">A copy of these details was sent to {data.email}.</p> : null}
        <Link href="/delegate" className="btn mt-8 inline-flex min-h-12">Delegate portal</Link>
        </div>
      </div>
    </>
  )
}
