import "server-only"
import { randomInt } from "node:crypto"
import { isStaff } from "@/domain/permissions"
import type { AppRole } from "@/domain/types"
import { createAdminClient } from "@/lib/supabase/admin"

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"

export function createDelegatePassword() {
  let password = ""
  for (let index = 0; index < 12; index += 1) password += alphabet[randomInt(alphabet.length)]
  return password
}

async function findAuthUser(email: string) {
  const admin = createAdminClient()
  const target = email.toLowerCase()
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error || data.users.length === 0) return null
    const found = data.users.find((user) => user.email?.toLowerCase() === target)
    if (found) return found
    if (data.users.length < 200) return null
  }
  return null
}

export async function ensureDelegateAccount(email: string, fullName: string): Promise<{ userId: string; password: string | null }> {
  const admin = createAdminClient()
  const password = createDelegatePassword()
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (!created.error && created.data.user) return { userId: created.data.user.id, password }

  const existing = await findAuthUser(email)
  if (!existing) throw new Error("The delegate login could not be created.")
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", existing.id)
  const assigned = (roles ?? []).map((row) => row.role).filter((role): role is AppRole => typeof role === "string")
  if (isStaff(assigned)) return { userId: existing.id, password: null }
  return { userId: existing.id, password: null }
}
