import { funnel } from '@/funnel.config'

/** Renders nothing without a URL, so an unfinished video never leaves a dead frame. */
export default function VideoBlock({
  which, title,
}: { which: 'landing' | 'thankYou'; title: string }) {
  const url = funnel.sections.videos?.[which]
  if (!url) return null

  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-center text-2xl md:text-3xl font-bold text-balance">{title}</h2>
        <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))]"
             style={{ aspectRatio: '16 / 9' }}>
          <iframe src={url} title={title} allowFullScreen
                  className="h-full w-full" style={{ border: 0 }} />
        </div>
      </div>
    </section>
  )
}
