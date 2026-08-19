import { funnel } from '@/funnel.config'

/** Two columns. The contrast does the arguing, so neither side needs adjectives. */
export default function BeforeAfter() {
  const ba = funnel.sections.beforeAfter
  if (!ba?.before.length && !ba?.after.length) return null

  const Col = ({ title, items, tone }: { title: string; items: string[]; tone: 'bad' | 'good' }) => (
    <div className={`rounded-xl border p-6 ${
      tone === 'bad' ? 'border-[hsl(var(--danger)/0.3)]' : 'border-[hsl(var(--success)/0.35)]'}`}>
      <h3 className="mb-5 font-bold">{title}</h3>
      <ul className="space-y-3">
        {items.map((t) => (
          <li key={t} className="flex gap-2.5 leading-relaxed text-[hsl(var(--muted))]">
            <span aria-hidden="true"
              className={tone === 'bad' ? 'text-[hsl(var(--danger))]' : 'text-[hsl(var(--success))]'}>
              {tone === 'bad' ? '✕' : '✓'}
            </span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-16 md:py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-10 text-center text-2xl md:text-3xl font-bold text-balance">
          Where you are, and where this takes you
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Col title="Right now" items={ba!.before} tone="bad" />
          <Col title={`After the ${funnel.event.days} nights`} items={ba!.after} tone="good" />
        </div>
      </div>
    </section>
  )
}
