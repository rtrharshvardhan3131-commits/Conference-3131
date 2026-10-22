import { isSupabaseConfigured } from "@/lib/env"

export function OfflineDesk({ title }: { title: string }) {
  if (isSupabaseConfigured()) return null
  return (
    <section>
      <p className="eyebrow">Committee desk</p>
      <h1 className="mt-3 font-serif text-5xl text-navy">{title}</h1>
      <p className="mt-4 max-w-xl text-slate">This desk reads and saves records in the conference database. Connect Supabase before using it.</p>
    </section>
  )
}
