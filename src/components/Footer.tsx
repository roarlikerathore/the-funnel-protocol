import { funnel } from '@/funnel.config'

export default function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))] px-4 py-10 text-center">
      <nav className="mb-4 text-sm text-[hsl(var(--muted))]">
        {[['Terms', '/terms'], ['Privacy', '/privacy'],
          ['Refunds', '/refund'], ['Disclaimer', '/disclaimer']].map(([label, href], i) => (
          <span key={href}>
            {i > 0 && <span className="mx-2 opacity-40">|</span>}
            <a href={href} className="hover:text-[hsl(var(--foreground))] transition">{label}</a>
          </span>
        ))}
        <span className="mx-2 opacity-40">|</span>
        <a href={`mailto:${funnel.brand.supportEmail}`}
           className="hover:text-[hsl(var(--foreground))] transition">Support</a>
      </nav>

      {funnel.legal.disclaimer && (
        <p className="mx-auto mb-4 max-w-3xl text-xs leading-relaxed text-[hsl(var(--muted))]">
          {funnel.legal.disclaimer}
        </p>
      )}

      <p className="text-xs text-[hsl(var(--muted))]">
        © {new Date().getFullYear()} {funnel.legal.entity || funnel.brand.name}. All rights reserved.
      </p>
    </footer>
  )
}
