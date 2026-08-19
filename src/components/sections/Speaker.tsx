import { funnel } from '@/funnel.config'

/** Who is presenting. Skipped entirely when no speaker is configured. */
export default function Speaker() {
  const s = funnel.sections.speaker
  if (!s) return null

  return (
    <section className="px-4 py-16 md:py-20">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 md:flex-row md:items-start">
        {s.photo && (
          <img src={s.photo} alt={s.name}
            className="h-32 w-32 flex-none rounded-2xl object-cover md:h-40 md:w-40" />
        )}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--accent))]">
            Your host
          </p>
          <h2 className="mb-1 text-2xl font-bold">{s.name}</h2>
          <p className="mb-4 text-[hsl(var(--muted))]">{s.role}</p>
          <p className="mb-5 whitespace-pre-line leading-relaxed">{s.bio}</p>

          {s.credentials.length > 0 && (
            <ul className="space-y-2">
              {s.credentials.map((c) => (
                <li key={c} className="flex gap-2.5 text-[hsl(var(--muted))]">
                  <span className="text-[hsl(var(--accent))]" aria-hidden="true">&#10003;</span>{c}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
