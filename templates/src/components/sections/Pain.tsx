import { funnel } from '@/funnel.config'

/** Their problem in their own words, before any claim about the solution. */
export default function Pain() {
  if (!funnel.audience.challenges.length) return null
  return (
    <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-2xl md:text-3xl font-bold text-balance">
          If any of this sounds familiar, you are in the right room
        </h2>
        <ul className="space-y-3">
          {funnel.audience.challenges.map((c) => (
            <li key={c} className="flex gap-3 rounded-lg border border-[hsl(var(--border))]
                                   bg-[hsl(var(--background))] px-5 py-4">
              <span aria-hidden="true" className="text-[hsl(var(--danger))] font-bold">→</span>
              <span className="text-[hsl(var(--muted))] leading-relaxed">{c}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-lg font-semibold text-balance">{funnel.promise.bigIdea}</p>
      </div>
    </section>
  )
}
