import { saveFaq, savePage } from "@/app/actions/admin"
import { OfflineDesk } from "@/components/admin/offline-desk"
import { isSupabaseConfigured } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/server/session"

export const instant = false

export default async function ContentPage() {
  await requirePermission("manage_content")
  if (!isSupabaseConfigured()) return <OfflineDesk title="Content" />
  const admin = createAdminClient()
  const { data: pages } = await admin.from("site_pages").select("slug, title, status")
  const { data: faqs } = await admin.from("faqs").select("id, question, status")
  return (
    <section className="grid gap-12">
      <h1 className="font-serif text-5xl text-navy">Content</h1>
      <form action={savePage} className="grid max-w-xl gap-3">
        <h2 className="font-serif text-3xl">Page</h2>
        <input name="slug" required placeholder="slug, for example about" className="border border-line px-3 py-3" />
        <input name="title" required placeholder="Title" className="border border-line px-3 py-3" />
        <input name="summary" placeholder="Summary" className="border border-line px-3 py-3" />
        <textarea name="body" required rows={8} placeholder="Body. Separate paragraphs with a blank line." className="border border-line px-3 py-3" />
        <select name="status" className="border border-line px-3 py-3"><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
        <button className="bg-navy px-5 py-3 text-ivory">Save page</button>
      </form>
      <ul>{(pages ?? []).map((page) => <li key={page.slug}>{page.slug} · {page.title} · {page.status}</li>)}</ul>
      <form action={saveFaq} className="grid max-w-xl gap-3">
        <h2 className="font-serif text-3xl">FAQ</h2>
        <input name="category" required placeholder="Category" className="border border-line px-3 py-3" />
        <input name="question" required placeholder="Question" className="border border-line px-3 py-3" />
        <textarea name="answer" required placeholder="Answer" className="border border-line px-3 py-3" />
        <select name="status" className="border border-line px-3 py-3"><option value="published">Published</option><option value="draft">Draft</option></select>
        <button className="bg-navy px-5 py-3 text-ivory">Save FAQ</button>
      </form>
      <ul>{(faqs ?? []).map((faq) => <li key={faq.id}>{faq.question} · {faq.status}</li>)}</ul>
    </section>
  )
}
