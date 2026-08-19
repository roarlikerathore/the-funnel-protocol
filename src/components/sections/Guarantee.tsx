import { funnel } from '@/funnel.config'

/** Only rendered when a real promise exists. Never invent one to fill the space. */
export default function Guarantee() {
  const g = funnel.sections.guarantee
  if (!g) return null
  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-xl border-2 border-[hsl(var(--accent)/0.4)]
                      bg-[hsl(var(--card))] p-7 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--accent))]">
          Our promise
        </p>
        <p className="text-lg leading-relaxed">{g}</p>
      </div>
    </section>
  )
}
