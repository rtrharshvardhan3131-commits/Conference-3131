import Link from "next/link"
import { isStaff } from "@/domain/permissions"
import { getActor } from "@/server/session"

export async function AccountLink() {
  const actor = await getActor()
  if (!actor) {
    return (
      <Link href="/login" className="hover:text-magenta">
        Delegate Login
      </Link>
    )
  }
  const href = isStaff(actor.roles) ? "/admin" : "/delegate"
  const label = isStaff(actor.roles) ? "Administration" : "Delegate portal"
  return (
    <Link href={href} className="hover:text-magenta">
      {label}
    </Link>
  )
}
