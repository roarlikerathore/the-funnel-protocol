import { funnel } from '@/funnel.config'

/**
 * Answers the objections that stop a registration. Built from config so the
 * event's own facts stay correct without anyone editing this file.
 */
const hours = Math.round(funnel.event.durationMinutes / 60)

const faqs = [
  { q: 'What does it cost?',
    a: funnel.event.isFree
       ? 'Nothing. It is free to attend live.'
       : 'See the pricing above. Payment is taken before you get access.' },
  { q: 'How long is each session?',
    a: `${hours} hours, for ${funnel.event.days} ${funnel.event.days === 1 ? 'night' : 'nights'}. Turn up for all of them if you can, they build on each other.` },
  { q: 'Is there a recording?',
    a: funnel.offer.upsell
       ? 'Not by default. Replays are part of the upgrade offered after you register.'
       : 'Plan to attend live. Anything shared afterwards is not guaranteed.' },
  { q: 'What if I have to miss a night?',
    a: 'Come to the ones you can. Night one matters most, because everything after it assumes you were there.' },
  { q: 'Where does it happen?',
    a: `On ${funnel.event.platform}. Your joining link is emailed the moment you register.` },
  { q: 'Do I need any experience?',
    a: 'No. It is built to make sense whether you are starting out or have been at this a while.' },
]

export default function FAQ() {
  return (
    <section className="px-4 py-16 md:py-20">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-8 text-2xl md:text-3xl font-bold">Questions people ask</h2>
        <div className="space-y-2.5">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-lg border border-[hsl(var(--border))]
                                          bg-[hsl(var(--card))] px-5">
              <summary className="cursor-pointer list-none py-4 font-semibold
                                  flex items-center justify-between gap-4">
                {f.q}
                <span aria-hidden="true" className="text-[hsl(var(--accent))] transition
                                                    group-open:rotate-45">+</span>
              </summary>
              <p className="pb-4 leading-relaxed text-[hsl(var(--muted))]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
