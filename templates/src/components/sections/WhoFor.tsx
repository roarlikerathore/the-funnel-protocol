import { funnel } from '@/funnel.config'

/**
 * The "not for you" column reliably outperforms the "for you" one: it is the
 * only part of a landing page that proves you are not chasing everybody.
 */
export default function WhoFor() {
  const { forWhom, notForWhom } = funnel.audience
  if (!forWhom.length && !notForWhom.length) return null

  return (
    <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-16 md:py-20">
      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
        <div>
          <h3 className="mb-5 flex items-center gap-2 text-lg font-bold">
            <span className="text-[hsl(var(--success))]" aria-hidden="true">✓</span> This is for you if
          </h3>
          <ul className="space-y-3">
            {forWhom.map((t) => (
              <li key={t} className="flex gap-2.5 text-[hsl(var(--muted))] leading-relaxed">
                <span className="text-[hsl(var(--success))]" aria-hidden="true">·</span>{t}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-5 flex items-center gap-2 text-lg font-bold">
            <span className="text-[hsl(var(--danger))]" aria-hidden="true">✕</span> Skip this if
          </h3>
          <ul className="space-y-3">
            {notForWhom.map((t) => (
              <li key={t} className="flex gap-2.5 text-[hsl(var(--muted))] leading-relaxed">
                <span className="text-[hsl(var(--danger))]" aria-hidden="true">·</span>{t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
