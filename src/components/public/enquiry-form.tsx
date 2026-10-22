"use client"

import { useActionState } from "react"
import { submitEnquiry, submitSponsorship, type ActionState } from "@/app/actions/public"

const initial: ActionState = { ok: false, message: "" }

export function ContactForm() {
  const [state, action, pending] = useActionState(submitEnquiry, initial)
  return (
    <form action={action} className="grid gap-5">
      <Status state={state} />
      <Field label="Name" name="name" required />
      <Field label="Email" name="email" type="email" required />
      <Field label="Subject" name="subject" required />
      <label className="grid gap-2 text-sm">
        Message
        <textarea name="message" required minLength={10} rows={6} className="border border-line bg-paper px-3 py-3" />
      </label>
      <Honeypot />
      <button disabled={pending} className="btn disabled:cursor-not-allowed">
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  )
}

export function SponsorshipForm() {
  const [state, action, pending] = useActionState(submitSponsorship, initial)
  return (
    <form action={action} className="grid gap-5">
      <Status state={state} />
      <Field label="Organisation" name="organisation" required />
      <Field label="Your name" name="name" required />
      <Field label="Email" name="email" type="email" required />
      <Field label="Mobile" name="phone" required />
      <label className="grid gap-2 text-sm">
        Message
        <textarea name="message" required minLength={10} rows={6} className="border border-line bg-paper px-3 py-3" />
      </label>
      <Honeypot />
      <button disabled={pending} className="btn">
        {pending ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  )
}

function Field({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm">
      {label}
      <input name={name} type={type} required={required} className="border border-line bg-paper px-3 py-3" />
    </label>
  )
}

function Honeypot() {
  return (
    <label className="absolute -left-[9999px]" aria-hidden="true">
      Website
      <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
    </label>
  )
}

function Status({ state }: { state: ActionState }) {
  if (!state.message) return null
  return (
    <p role="status" className={state.ok ? "border border-gold bg-gold/10 px-4 py-3 text-navy" : "border border-red-800/30 bg-red-50 px-4 py-3 text-red-900"}>
      {state.message}
    </p>
  )
}
