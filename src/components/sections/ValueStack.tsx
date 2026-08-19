import { funnel } from '@/funnel.config'

/**
 * Adds up what the seat is worth, then sets it against what it costs.
 * Every number here has to be one you could defend out loud, because someone
 * eventually will ask.
 */
export default function ValueStack({ onRegister }: { onRegister: () => void }) {
  const vs = funnel.sections.valueStack
  if (!vs?.items.length) return null

  const total = vs.items.reduce((sum, i) => sum + (Number(i.worth) || 0), 0)
  const fmt = (n: number) => `${vs.currency} ${n.toLocaleString()}`

  return (
    <section className="px-4 py-16 md:py-20">
      <div className="mx-auto max-w-xl">
        <h2 className="mb-8 text-center text-2xl md:text-3xl font-bold text-balance">
          Everything you get
        </h2>

        <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))]
                        bg-[hsl(var(--card))]">
          {vs.items.map((i) => (
            <div key={i.name} className="flex items-start justify-between gap-4 border-b
                                         border-[hsl(var(--border))] px-5 py-4">
              <span className="flex gap-2.5">
                <span className="text-[hsl(var(--accent))]" aria-hidden="true">&#10003;</span>
                {i.name}
              </span>
              <span className="flex-none tabular-nums text-[hsl(var(--muted))]">{fmt(i.worth)}</span>
            </div>
          ))}

          <div className="flex items-center justify-between px-5 py-4">
            <span className="font-bold">Total value</span>
            <span className="font-bold tabular-nums line-through opacity-50">{fmt(total)}</span>
          </div>

          <div className="bg-[hsl(var(--accent)/0.1)] px-5 py-6 text-center">
            <p className="mb-1 text-sm uppercase tracking-wider text-[hsl(var(--muted))]">
              Your price today
            </p>
            <p className="text-4xl font-bold text-[hsl(var(--accent))]">
              {funnel.event.isFree ? 'Free' : fmt(0)}
            </p>
          </div>
        </div>

        <button onClick={onRegister}
          className="mt-6 w-full rounded-xl bg-[hsl(var(--accent))] px-8 py-4 text-lg font-bold
                     text-[hsl(var(--background))] transition hover:opacity-90">
          Claim my seat
        </button>
      </div>
    </section>
  )
}
