import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
const emails = (process.env.BOOTSTRAP_ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean)

if (!url || !secret || emails.length === 0) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, and BOOTSTRAP_ADMIN_EMAILS.")
  process.exit(1)
}

const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
if (error) {
  console.error("Could not list users.")
  process.exit(1)
}

for (const email of emails) {
  const user = data.users.find((item) => item.email?.toLowerCase() === email)
  if (!user) {
    console.log(`No auth user for ${email}. Create that user in Supabase Auth first.`)
    continue
  }
  const { error: roleError } = await admin.from("user_roles").upsert({ user_id: user.id, role: "super_admin" }, { onConflict: "user_id,role" })
  if (roleError) {
    console.error(`Could not assign super_admin to ${email}.`)
    continue
  }
  console.log(`Assigned super_admin to ${email}.`)
}
