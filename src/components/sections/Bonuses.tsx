import { funnel } from '@/funnel.config'

/** Extras included with registration, separate from anything paid. */
export default function Bonuses() {
  const bonuses = funnel.sections.bonuses
  if (!bonuses?.length) return null

  const total = bonuses.reduce((sum, b) => {
    const n = Number(String(b.worth).replace(/[^0-9.]/g, ''))
    return sum + (isFinite(n) ? n : 0)
  }, 0)

  return (
    <section className="px-4 py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-3 text-center text-2xl md:text-3xl font-bold text-balance">
          Included when you register
        </h2>
        <p className="mb-10 text-center text-[hsl(var(--muted))]">
          Yours whether or not you buy anything.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {bonuses.map((b) => (
            <div key={b.name} className="rounded-xl border border-[hsl(var(--border))]
                                         bg-[hsl(var(--card))] p-6">
              {b.image && (
                <img src={b.image} alt="" className="mb-4 h-32 w-full rounded-lg object-contain" />
              )}
              <h3 className="mb-1 font-bold leading-snug">{b.name}</h3>
              {b.description && (
                <p className="mb-3 text-sm leading-relaxed text-[hsl(var(--muted))]">{b.description}</p>
              )}
              <p className="text-sm font-semibold text-[hsl(var(--accent))]">Worth {b.worth}</p>
            </div>
          ))}
        </div>

        {total > 0 && (
          <p className="mt-8 text-center text-lg">
            Total value{' '}
            <span className="font-bold text-[hsl(var(--accent))] tabular-nums">
              {total.toLocaleString()}
            </span>
            , included free.
          </p>
        )}
      </div>
    </section>
  )
}
