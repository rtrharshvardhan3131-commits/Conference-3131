export function PageIntro({ eyebrow, title, summary }: { eyebrow: string; title: string; summary?: string }) {
  return (
    <section className="border-b border-ivory/10 bg-navy text-ivory">
      <div className="container-summit py-8 md:py-16">
        <p className="text-xs tracking-[0.28em] text-gold uppercase">{eyebrow}</p>
        <h1 className="display mt-4 max-w-4xl text-4xl md:text-6xl">{title}</h1>
        {summary ? <p className="mt-4 max-w-2xl text-ivory/75">{summary}</p> : null}
      </div>
    </section>
  )
}
