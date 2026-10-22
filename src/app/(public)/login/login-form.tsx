"use client"

import { useActionState } from "react"
import { sendMagicLink, signIn } from "@/app/actions/auth"

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, { message: "" })
  return (
    <div className="container-summit grid max-w-xl gap-10 py-16">
      {state.message ? <p role="alert" className="border border-red-800/30 bg-red-50 px-4 py-3">{state.message}</p> : null}
      <form action={action} className="grid gap-4">
        <label className="grid gap-2 text-sm">Email<input name="email" type="email" required className="border border-line px-3 py-3" /></label>
        <label className="grid gap-2 text-sm">Password<input name="password" type="password" required minLength={8} className="border border-line px-3 py-3" /></label>
        <button disabled={pending} className="btn">{pending ? "Signing in…" : "Sign in"}</button>
      </form>
      <form action={sendMagicLink} className="grid gap-4 border-t border-line pt-8">
        <p className="text-slate">Or receive a sign-in link, if email authentication is enabled on the project.</p>
        <label className="grid gap-2 text-sm">Email<input name="email" type="email" required className="border border-line px-3 py-3" /></label>
        <button className="btn-ghost inline-flex">Email me a link</button>
      </form>
    </div>
  )
}
