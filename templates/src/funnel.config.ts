/**
 * THE ONLY FILE THAT KNOWS WHAT THIS FUNNEL IS ABOUT.
 *
 * Every page, every email, every WhatsApp message and the whole database seed read
 * from here. Changing the niche from trading to fitness to language coaching means
 * editing this file and nothing else.
 *
 * If you find yourself typing a brand name, a price, a date or a sentence of copy
 * into a component, stop: it belongs here.
 */

export interface Testimonial { name: string; quote: string; result?: string; photo?: string }
export interface Session     { day: number; title: string; outcome: string }
export interface OfferItem   { name: string; worth: string }
export interface Offer {
  name: string
  price: number
  currency: string
  checkoutUrl: string
  items: OfferItem[]
}

export interface FunnelConfig {
  brand: {
    name: string
    /** How the host signs emails. Usually a first name or a surname, not the full legal name. */
    host: string
    tagline: string
    domain: string
    supportEmail: string
    /** Bulk mail sends from a subdomain so a spam complaint never poisons the root domain. */
    sendingSubdomain: string
    logo?: string
  }

  event: {
    name: string
    days: number
    /** ISO date, YYYY-MM-DD, of night one. */
    startDate: string
    /** 24h local time, HH:MM. */
    startTime: string
    /** IANA zone, e.g. "Asia/Kolkata". Everything user-facing renders in this. */
    timezone: string
    durationMinutes: number
    platform: string
    joinUrl: string
    isFree: boolean
  }

  promise: {
    headline: string
    subheadline: string
    /** The one belief that has to change. Everything else on the page serves this. */
    bigIdea: string
  }

  audience: {
    forWhom: string[]
    /** Converts better than forWhom, because it proves you are not chasing everyone. */
    notForWhom: string[]
    /** Drives the registration dropdown AND email personalisation. 5-6 items. */
    profiles: string[]
    /** Same. 5 items. Written the way they would say it at 11pm. */
    challenges: string[]
  }

  /** Titles must not contain the reveal. See the spoiler rule in the build order. */
  sessions: Session[]

  proof: {
    testimonials: Testimonial[]
    stats: { label: string; value: string }[]
    credibility: string
  }

  offer: {
    upsell: Offer | null
    downsell: Offer | null
  }

  theme: {
    /** Any CSS colour. Everything else is derived from these two. */
    primary: string
    accent: string
    mode: 'dark' | 'light'
    mood: string[]
  }

  links: {
    whatsappGroup?: string
    calendar?: string
    replay?: string
  }

  messaging: {
    /** Minutes to wait before the confirmation, so the upsell has resolved first. */
    confirmDelayMinutes: number
    whatsapp: {
      enabled: boolean
      provider: 'cloud_api' | 'bsp' | 'backoffice' | 'none'
      businessNumber?: string
    }
    calls: {
      enabled: boolean
      leadTimeMinutes: number
      countryCode: string
    }
  }

  legal: {
    entity: string
    address: string
    jurisdiction: string
    refundPolicy: string
    /** Any regulator disclaimer the user is legally required to carry. */
    disclaimer: string
  }
}

/* ------------------------------------------------------------------------- *
 * Replace everything below with the answers from the funnel brief.
 * Anything left as PLACEHOLDER is listed in STILL-NEEDED.md and must not ship.
 * ------------------------------------------------------------------------- */

export const funnel: FunnelConfig = {
  brand: {
    name: 'PLACEHOLDER Brand',
    host: 'PLACEHOLDER',
    tagline: 'PLACEHOLDER one line on what you teach',
    domain: 'example.com',
    supportEmail: 'hello@example.com',
    sendingSubdomain: 'mail.example.com',
  },

  event: {
    name: 'PLACEHOLDER Event',
    days: 3,
    startDate: '2026-01-01',
    startTime: '20:00',
    timezone: 'Asia/Kolkata',
    durationMinutes: 120,
    platform: 'Zoom',
    joinUrl: 'https://example.com/join',
    isFree: true,
  },

  promise: {
    headline: 'PLACEHOLDER headline',
    subheadline: 'PLACEHOLDER subheadline',
    bigIdea: 'PLACEHOLDER the one belief that has to change',
  },

  audience: {
    forWhom: ['PLACEHOLDER'],
    notForWhom: ['PLACEHOLDER'],
    profiles: ['PLACEHOLDER'],
    challenges: ['PLACEHOLDER'],
  },

  sessions: [
    { day: 1, title: 'PLACEHOLDER', outcome: 'PLACEHOLDER' },
    { day: 2, title: 'PLACEHOLDER', outcome: 'PLACEHOLDER' },
    { day: 3, title: 'PLACEHOLDER', outcome: 'PLACEHOLDER' },
  ],

  proof: { testimonials: [], stats: [], credibility: 'PLACEHOLDER' },

  offer: { upsell: null, downsell: null },

  theme: { primary: '#1E3A5F', accent: '#C9A227', mode: 'dark', mood: ['clear', 'direct'] },

  links: {},

  messaging: {
    confirmDelayMinutes: 5,
    whatsapp: { enabled: false, provider: 'none' },
    calls: { enabled: false, leadTimeMinutes: 30, countryCode: '+91' },
  },

  legal: {
    entity: 'PLACEHOLDER',
    address: 'PLACEHOLDER',
    jurisdiction: 'PLACEHOLDER',
    refundPolicy: 'PLACEHOLDER',
    disclaimer: 'PLACEHOLDER',
  },
}

/** Every PLACEHOLDER still in the config. Drives STILL-NEEDED.md and blocks launch. */
export const findPlaceholders = (o: unknown, path = ''): string[] => {
  if (typeof o === 'string') return o.includes('PLACEHOLDER') ? [path] : []
  if (Array.isArray(o)) return o.flatMap((v, i) => findPlaceholders(v, `${path}[${i}]`))
  if (o && typeof o === 'object')
    return Object.entries(o).flatMap(([k, v]) => findPlaceholders(v, path ? `${path}.${k}` : k))
  return []
}

export default funnel
