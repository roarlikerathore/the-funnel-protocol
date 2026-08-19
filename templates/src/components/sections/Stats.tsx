import { funnel } from '@/funnel.config'

export default function Stats() {
  const { stats } = funnel.proof
  if (!stats.length) return null
  return (
    <section className="px-4 py-12">
      <div className="mx-auto grid max-w-3xl gap-6 text-center"
           style={{ gridTemplateColumns: `repeat(auto-fit,minmax(140px,1fr))` }}>
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-3xl md:text-4xl font-bold text-[hsl(var(--accent))] tabular-nums">{s.value}</div>
            <div className="mt-1 text-sm text-[hsl(var(--muted))]">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
