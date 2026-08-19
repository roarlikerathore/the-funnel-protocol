import { funnel } from '@/funnel.config'

/**
 * Titles here must not contain their own reveal. A session called "How X Works"
 * answers the question and removes the reason to attend.
 */
export default function Sessions() {
  return (
    <section className="px-4 py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-3 text-2xl md:text-3xl font-bold text-balance">
          What happens across the {funnel.event.days} nights
        </h2>
        <p className="mb-10 text-[hsl(var(--muted))]">
          {Math.round(funnel.event.durationMinutes / 60)} hours each night, live.
        </p>

        <div className="space-y-4">
          {funnel.sessions.map((s) => (
            <div key={s.day} className="flex gap-5 rounded-xl border border-[hsl(var(--border))]
                                        bg-[hsl(var(--card))] p-5 md:p-6">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg
                              bg-[hsl(var(--accent)/0.12)] font-bold text-[hsl(var(--accent))]">
                {s.day}
              </div>
              <div>
                <h3 className="mb-1.5 text-lg font-bold leading-snug">{s.title}</h3>
                <p className="text-[hsl(var(--muted))] leading-relaxed">{s.outcome}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
