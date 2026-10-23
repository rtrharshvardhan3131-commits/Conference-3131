import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/env"
import { createPublicClient } from "@/lib/supabase/public"

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, database: "unconfigured" }, { status: 503 })
  }
  const supabase = createPublicClient()
  const { error } = await supabase.from("event_settings").select("id").eq("id", 1).maybeSingle()
  if (error) return NextResponse.json({ ok: false, database: "unavailable" }, { status: 503 })
  return NextResponse.json({ ok: true, database: "ready" })
}
