function read(name: string): string | undefined {
  const value = process.env[name]
  if (!value || value.trim().length === 0) return undefined
  return value.trim()
}

export function isSupabaseConfigured(): boolean {
  return Boolean(read("NEXT_PUBLIC_SUPABASE_URL") && supabasePublishableKey())
}

export function supabaseUrl(): string {
  const url = read("NEXT_PUBLIC_SUPABASE_URL")
  if (!url) throw new Error("Supabase URL is not configured.")
  return url
}

export function supabasePublishableKey(): string | undefined {
  return read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ?? read("NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

export function supabaseSecretKey(): string | undefined {
  return read("SUPABASE_SECRET_KEY") ?? read("SUPABASE_SERVICE_ROLE_KEY")
}

export function isPaymentConfigured(): boolean {
  return Boolean(read("RAZORPAY_KEY_ID") && read("RAZORPAY_KEY_SECRET") && read("NEXT_PUBLIC_RAZORPAY_KEY_ID"))
}

export function isEmailConfigured(): boolean {
  return Boolean(read("GMAIL_APP_PASSWORD"))
}

export function appUrl(): string {
  return read("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000"
}

export function signingSecret(): string | undefined {
  return read("APP_SIGNING_SECRET") ?? supabaseSecretKey()
}
