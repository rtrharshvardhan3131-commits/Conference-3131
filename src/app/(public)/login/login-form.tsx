"use client"

import { useActionState } from "react"
import { sendMagicLink, signIn } from "@/app/actions/auth"

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, { message: "" })
  const [linkState, linkAction, linkPending] = useActionState(sendMagicLink, { message: "" })
  return (
    <div className="container-summit grid max-w-xl gap-6 py-10 md:py-16">
      {state.message ? <p role="alert" className="border border-red-800/30 bg-red-50 px-4 py-3 text-sm text-red-900">{state.message}</p> : null}
      <form action={action} className="grid gap-4 border border-line bg-paper px-5 py-6">
        <h2 className="font-serif text-2xl text-ink">Password</h2>
        <label className="grid gap-2 text-sm font-medium">Email<input name="email" type="email" required autoComplete="email" className="border border-line bg-ivory px-3" /></label>
        <label className="grid gap-2 text-sm font-medium">Password<input name="password" type="password" required minLength={8} autoComplete="current-password" className="border border-line bg-ivory px-3" /></label>
        <button disabled={pending} className="btn">{pending ? "Signing in…" : "Sign in"}</button>
      </form>
      <form action={linkAction} className="grid gap-4 border border-line bg-paper px-5 py-6">
        <h2 className="font-serif text-2xl text-ink">Sign-in link</h2>
        <p className="text-sm leading-relaxed text-slate">Receive a link at the email on your registration, when email sign-in is enabled.</p>
        {linkState.message ? <p role="alert" className="border border-red-800/30 bg-red-50 px-4 py-3 text-sm text-red-900">{linkState.message}</p> : null}
        <label className="grid gap-2 text-sm font-medium">Email<input name="email" type="email" required autoComplete="email" className="border border-line bg-ivory px-3" /></label>
        <button disabled={linkPending} className="btn-ghost inline-flex">{linkPending ? "Sending…" : "Email me a link"}</button>
      </form>
    </div>
  )
}
