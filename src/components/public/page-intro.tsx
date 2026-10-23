export function PageIntro({ eyebrow, title, summary }: { eyebrow: string; title: string; summary?: string }) {
  return (
    <section className="cinematic-band relative w-full max-w-full overflow-hidden bg-[#070b14] text-ivory">
      <div className="pointer-events-none absolute -top-24 right-[-4rem] h-72 w-72 rounded-full border border-gold/30" aria-hidden="true" />
      <div className="pointer-events-none absolute top-6 right-10 h-40 w-40 rounded-full border border-cranberry/50" aria-hidden="true" />
      <div className="container-summit relative py-12 md:py-20">
        <p className="text-xs font-semibold tracking-[0.28em] text-gold uppercase">{eyebrow}</p>
        <h1 className="display mt-3 max-w-4xl text-5xl text-ivory md:text-7xl">{title}</h1>
        {summary ? <p className="mt-5 max-w-2xl text-base leading-relaxed text-ivory/75 md:text-lg">{summary}</p> : null}
      </div>
    </section>
  )
}