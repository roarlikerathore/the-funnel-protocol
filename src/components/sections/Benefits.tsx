import { funnel } from '@/funnel.config'

/** What implementing this actually changes. Distinct from what they will learn. */
export default function Benefits() {
  const items = funnel.sections.benefits
  if (!items?.length) return null

  return (
    <section className="px-4 py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-10 text-center text-2xl md:text-3xl font-bold text-balance">
          What changes once you actually use this
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {items.map((b) => (
            <div key={b.title} className="rounded-xl border border-[hsl(var(--border))]
                                          bg-[hsl(var(--card))] p-6">
              <h3 className="mb-2 font-bold leading-snug">{b.title}</h3>
              <p className="leading-relaxed text-[hsl(var(--muted))]">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
