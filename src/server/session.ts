import "server-only"
import { redirect } from "next/navigation"
import { hasPermission, isStaff } from "@/domain/permissions"
import type { AppRole, Permission } from "@/domain/types"
import { isSupabaseConfigured } from "@/lib/env"
import { createServerSupabase } from "@/lib/supabase/server"

export type Actor = {
  id: string
  email: string
  roles: AppRole[]
}

const roleSet = new Set<AppRole>([
  "super_admin",
  "district_admin",
  "finance_admin",
  "registration_admin",
  "content_editor",
  "delegate",
])

export async function getActor(): Promise<Actor | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) return null
  const email = typeof data.claims.email === "string" ? data.claims.email : ""
  const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", data.claims.sub)
  const roles = (roleRows ?? [])
    .map((row) => row.role)
    .filter((role): role is AppRole => roleSet.has(role as AppRole))
  return { id: data.claims.sub, email, roles }
}

export async function requireActor(): Promise<Actor> {
  const actor = await getActor()
  if (!actor) redirect("/login")
  return actor
}

export async function requirePermission(permission: Permission): Promise<Actor> {
  const actor = await requireActor()
  if (!hasPermission(actor.roles, permission)) redirect(isStaff(actor.roles) ? "/admin" : "/delegate")
  return actor
}
