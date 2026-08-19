import { funnel } from '@/funnel.config'

export default function TopBanner() {
  const text = funnel.sections.topBanner
  if (!text) return null
  return (
    <div className="bg-[hsl(var(--accent))] px-4 py-2.5 text-center text-sm font-semibold
                    text-[hsl(var(--background))]">{text}</div>
  )
}
