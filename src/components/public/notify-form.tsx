"use client"

import { useActionState } from "react"
import { subscribeInterest, type ActionState } from "@/app/actions/public"

const initial: ActionState = { ok: false, message: "" }

export function NotifyForm({ topic, targetNote }: { topic: "speakers" | "sponsors" | "venue"; targetNote?: string | null }) {
  const [state, action, pending] = useActionState(subscribeInterest, initial)
  return (
    <form action={action} className="mt-6 grid gap-3">
      {targetNote ? <p className="text-sm text-slate">{targetNote}</p> : null}
      <label htmlFor={`notify-${topic}`} className="text-sm font-medium">
        Email address
      </label>
      <input id={`notify-${topic}`} name="email" type="email" required autoComplete="email" inputMode="email" className="border border-line bg-paper px-3 text-base text-ink" />
      <input name="topic" type="hidden" value={topic} />
      <input name="companyWebsite" type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <button type="submit" disabled={pending} className="btn w-full sm:w-auto">
        {pending ? "Saving…" : "Notify me"}
      </button>
      {state.message ? (
        <p role="status" aria-live="polite" className="text-sm text-ink">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
