import { funnel } from '@/funnel.config'

/**
 * The three shifts the event is built on. Numbered because they genuinely are a
 * sequence: each one only makes sense once the previous has landed.
 */
export default function Methods() {
  const methods = funnel.sections.methods
  if (!methods?.length) return null

  return (
    <section className="px-4 py-16 md:py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-10 text-center text-2xl md:text-3xl font-bold text-balance">
          What has to change
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {methods.map((m) => (
            <div key={m.number} className="rounded-xl border border-[hsl(var(--border))]
                                           bg-[hsl(var(--card))] p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg
                              bg-[hsl(var(--accent)/0.12)] font-bold text-[hsl(var(--accent))]
                              tabular-nums">
                {m.number}
              </div>
              <h3 className="mb-2 text-lg font-bold leading-snug">{m.title}</h3>
              <p className="leading-relaxed text-[hsl(var(--muted))]">{m.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
