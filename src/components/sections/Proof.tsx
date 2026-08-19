import { funnel } from '@/funnel.config'

/** Renders nothing when there are no real testimonials. An empty section beats a fabricated one. */
export default function Proof() {
  const { testimonials, credibility } = funnel.proof
  if (!testimonials.length && !credibility) return null

  return (
    <section className="px-4 py-16 md:py-20">
      <div className="mx-auto max-w-4xl">
        {credibility && (
          <div className="mb-12 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 md:p-8">
            <h2 className="mb-3 text-xl font-bold">Who is running this</h2>
            <p className="whitespace-pre-line leading-relaxed text-[hsl(var(--muted))]">{credibility}</p>
          </div>
        )}

        {testimonials.length > 0 && (
          <>
            <h2 className="mb-8 text-2xl md:text-3xl font-bold text-balance">
              From people who were in the room
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {testimonials.map((t) => (
                <figure key={t.name} className="rounded-xl border border-[hsl(var(--border))]
                                                bg-[hsl(var(--card))] p-6">
                  <blockquote className="mb-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="flex items-center gap-3">
                    {t.photo && <img src={t.photo} alt="" className="h-10 w-10 rounded-full object-cover" />}
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      {t.result && <div className="text-xs text-[hsl(var(--accent))]">{t.result}</div>}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
