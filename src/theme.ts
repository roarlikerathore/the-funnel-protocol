/**
 * Turns the two colours in funnel.config into a full palette at runtime.
 *
 * The user picks a primary and an accent. Everything else - hovers, borders,
 * muted text, surfaces - is derived, so a non-designer cannot produce a page
 * with unreadable contrast by choosing badly.
 */
import { funnel } from './funnel.config'

const hexToHsl = (hex: string): [number, number, number] => {
  const m = hex.replace('#', '')
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0))
          : max === g ? (b - r) / d + 2
          : (r - g) / d + 4
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)]
}

const hsl = (h: number, s: number, l: number) => `${h} ${s}% ${Math.max(0, Math.min(100, l))}%`

/** Injects CSS custom properties. Called once, before the app paints. */
export const applyTheme = () => {
  const { primary, accent, mode } = funnel.theme
  const [ph, ps, pl] = hexToHsl(primary)
  const [ah, as, al] = hexToHsl(accent)
  const dark = mode === 'dark'

  const vars: Record<string, string> = {
    '--primary':       hsl(ph, ps, pl),
    '--primary-light': hsl(ph, ps, pl + 12),
    '--primary-dark':  hsl(ph, ps, pl - 12),
    '--accent':        hsl(ah, as, al),
    '--accent-light':  hsl(ah, as, al + 12),
    '--accent-dark':   hsl(ah, as, al - 12),

    // Neutrals carry a trace of the primary hue so the page reads as one system
    // rather than brand colours dropped onto default grey.
    '--background':    dark ? hsl(ph, 12, 7)  : hsl(ph, 18, 98),
    '--foreground':    dark ? hsl(ph, 10, 96) : hsl(ph, 22, 10),
    '--card':          dark ? hsl(ph, 12, 11) : hsl(ph, 20, 100),
    '--muted':         dark ? hsl(ph, 10, 62) : hsl(ph, 14, 42),
    '--border':        dark ? hsl(ph, 12, 20) : hsl(ph, 16, 88),

    // Semantic, deliberately independent of the brand accent
    '--success': '152 55% 42%',
    '--danger':  '0 72% 51%',
  }

  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  root.style.colorScheme = mode
}

export default applyTheme
