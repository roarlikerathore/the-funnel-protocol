// Token rendering shared by enqueue-sequence (queue time) and process-resend-queue
// (send time, when a variant email is resolved against what the lead actually bought).
// Both paths MUST produce byte-identical output, so the logic lives here once.

/** Set from site_settings.site_url at call time. No domain is ever hardcoded. */
let SITE = ''

const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']
const ordinal = (n: number) => { const s = ['TH','ST','ND','RD']; const v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]) }

/** "AUGUST 28TH to AUGUST 30TH" from the event start date. Always a 3 day window. */
export const eventRangeLabel = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const day = (o: number) => { const dt = new Date(y, m - 1, d + o); return `${MONTHS[dt.getMonth()]} ${ordinal(dt.getDate())}` }
  return `${day(0)} to ${day(2)}`
}

/** "8 PM" / "7:30 PM" from a 24h IST string. */
export const timeLabel = (t: string) => {
  const [hh, mm] = (t || '20:00').split(':').map(Number)
  const h12 = ((hh + 11) % 12) + 1
  const ampm = hh >= 12 ? 'PM' : 'AM'
  return mm ? `${h12}:${String(mm).padStart(2, '0')} ${ampm}` : `${h12} ${ampm}`
}

/** "2 hours" reads better than "120 minutes"; under an hour stays in minutes. */
export const durationLabel = (mins: number) => {
  if (!mins || mins < 60) return `${mins || 0} minutes`
  const h = mins / 60
  return h === 1 ? '1 hour' : `${Number.isInteger(h) ? h : h.toFixed(1)} hours`
}

/** Five minutes before the start, for "join by" lines. */
export const doorsLabel = (t: string) => {
  const [hh, mm] = (t || '20:00').split(':').map(Number)
  const d = new Date(2000, 0, 1, hh, mm - 5)
  return timeLabel(`${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`)
}

export interface RenderLead {
  first_name: string
  profile?: string
  challenge?: string
  email?: string
}

export interface EventLabels {
  eventRange: string
  eventTime: string
  eventDoors: string
  /** "2 hours" / "90 minutes", from site_settings.event_duration_minutes. */
  eventDuration: string
  /** Where a buyer collects what they paid for. Settings backed so links can move without a deploy. */
  vipAccessUrl?: string
  ipAccessUrl?: string
}

/** Build the labels once from site_settings. */
export const eventLabels = (s: Record<string, string>): EventLabels => {
  SITE = s.site_url || ''
  const date = s.event_date || ''
  const time = s.event_time || '20:00'
  return {
    eventRange: eventRangeLabel(date),
    eventTime: timeLabel(time),
    eventDoors: doorsLabel(time),
    eventDuration: durationLabel(Number(s.event_duration_minutes || 120)),
    vipAccessUrl: s.upsell_access_url || s.whatsapp_group_url || '',
    ipAccessUrl: s.downsell_access_url || s.whatsapp_group_url || '',
  }
}

/** Swap {{first_name}}, the event labels, and the personalisation block tokens. */
export const render = (
  text: string,
  lead: RenderLead,
  blocks: Record<string, Record<string, string>>,
  labels: EventLabels,
) => {
  const pick = (token: string, key?: string) =>
    (blocks[token] && (blocks[token][key || ''] ?? blocks[token]['default'])) || ''
  const prefs = `${SITE}/preferences?e=${encodeURIComponent(lead.email || '')}`
  return (text || '')
    .replace(/\{\{\s*EVENT_RANGE\s*\}\}/g, labels.eventRange)
    .replace(/\{\{\s*EVENT_TIME\s*\}\}/g, labels.eventTime)
    .replace(/\{\{\s*EVENT_DOORS\s*\}\}/g, labels.eventDoors)
    .replace(/\{\{\s*EVENT_DURATION\s*\}\}/g, labels.eventDuration)
    .replace(/\{\{\s*VIP_ACCESS_URL\s*\}\}/g, labels.vipAccessUrl || '')
    .replace(/\{\{\s*IP_ACCESS_URL\s*\}\}/g, labels.ipAccessUrl || '')
    .replace(/\{\{\s*PREFS_URL\s*\}\}/g, prefs)
    .replace(/\{\{\s*UNSUB_URL\s*\}\}/g, `${prefs}&unsub=1`)
    .replace(/\{\{\s*first_name\s*\}\}/g, lead.first_name)
    .replace(/\{\{\s*PROFILE_MIRROR\s*\}\}/g, pick('PROFILE_MIRROR', lead.profile))
    .replace(/\{\{\s*PAIN_TWIST\s*\}\}/g, pick('PAIN_TWIST', lead.challenge))
    .replace(/\{\{\s*PROOF\s*\}\}/g, pick('PROOF', lead.challenge))
    .replace(/\{\{\s*CTA_LINE\s*\}\}/g, pick('CTA_LINE', lead.profile))
}

/** Tag every outbound link so the Control Room can rank templates and frameworks. */
export const tagLinks = (html: string, seqKey: string, campaign: string, tplKey: string, framework: string) =>
  html.replace(/href="(https?:\/\/[^"]+)"/g, (m, url) => {
    if (url.includes('utm_source=')) return m
    if (/unsubscribe|preferences|mailto:/i.test(url)) return m
    const sep = url.includes('?') ? '&' : '?'
    const utm = `utm_source=email&utm_medium=${encodeURIComponent(seqKey)}` +
      `&utm_campaign=${encodeURIComponent(campaign)}` +
      `&utm_content=${encodeURIComponent(tplKey)}&utm_term=${encodeURIComponent(framework)}`
    return `href="${url}${sep}${utm}"`
  })

/** Load the 6x5 personalisation blocks into { token: { match_key: body } }. */
export const loadBlocks = async (sb: any): Promise<Record<string, Record<string, string>>> => {
  const { data } = await sb.from('email_blocks').select('token, match_key, body')
  const blocks: Record<string, Record<string, string>> = {}
  ;(data || []).forEach((b: any) => {
    blocks[b.token] = blocks[b.token] || {}
    blocks[b.token][b.match_key] = b.body
  })
  return blocks
}
