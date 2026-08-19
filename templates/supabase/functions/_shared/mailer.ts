// One place that actually sends email. Every function goes through this.
//
// The provider is a SETTING, not code: site_settings.email_provider = 'resend' | 'builtin'.
// Switching providers is a dropdown in the Control Room, no deploy, no rewrite.
//
//   resend  -> api.resend.com using RESEND_API_KEY            (working today)
//   builtin -> whatever endpoint BUILTIN_EMAIL_ENDPOINT names, with BUILTIN_EMAIL_KEY.
//              Lovable's native email is wired in by setting those two secrets; no code change.
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
// SENDER: bulk mail goes from a subdomain, never the root domain. If a batch ever gets
// marked as spam the damage stays on the sending subdomain and the root domain keeps its
// clean reputation for the mailbox the user actually reads.
// Resolution order is secret -> site_settings.sender_email -> this default, so moving the
// sending domain again is a Control Room edit rather than a redeploy.
// The sending subdomain has no MX, so replies to it would bounce. Emails invite replies,
// so reply_to points at the real inbox.
const SENDER_EMAIL_ENV = Deno.env.get('SENDER_EMAIL') || ''
const SENDER_EMAIL_DEFAULT = ''   // set by site_settings.sender_email
const REPLY_TO_ENV = Deno.env.get('REPLY_TO_EMAIL') || ''
const REPLY_TO_DEFAULT = ''       // set by site_settings.reply_to_email
const SENDER_NAME = Deno.env.get('SENDER_NAME') || ''
const BUILTIN_ENDPOINT = Deno.env.get('BUILTIN_EMAIL_ENDPOINT') || ''
const BUILTIN_KEY = Deno.env.get('BUILTIN_EMAIL_KEY') || ''

export interface MailInput {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
  /** Global SEBI/footer HTML from site_settings is appended unless this is false. */
  appendFooter?: boolean
}

export interface MailResult {
  ok: boolean
  id: string | null
  provider: string
  error?: unknown
}

const admin = () => createClient(SUPABASE_URL, SERVICE_KEY)

const getSetting = async (key: string, fallback = ''): Promise<string> => {
  try {
    const { data } = await admin().from('site_settings').select('setting_value').eq('setting_key', key).maybeSingle()
    return data?.setting_value || fallback
  } catch {
    return fallback
  }
}

const viaResend = async (from: string, to: string[], subject: string, html: string, replyTo?: string): Promise<MailResult> => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html, reply_to: replyTo }),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok && !!data?.id, id: data?.id ?? null, provider: 'resend', error: res.ok ? undefined : data }
}

const viaBuiltin = async (from: string, to: string[], subject: string, html: string, replyTo?: string): Promise<MailResult> => {
  if (!BUILTIN_ENDPOINT) {
    return { ok: false, id: null, provider: 'builtin', error: 'BUILTIN_EMAIL_ENDPOINT secret is not set' }
  }
  const res = await fetch(BUILTIN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(BUILTIN_KEY ? { Authorization: `Bearer ${BUILTIN_KEY}` } : {}),
    },
    body: JSON.stringify({ from, to, subject, html, reply_to: replyTo }),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, id: data?.id ?? null, provider: 'builtin', error: res.ok ? undefined : data }
}

export const sendMail = async (input: MailInput): Promise<MailResult> => {
  const to = Array.isArray(input.to) ? input.to : [input.to]
  const sender = SENDER_EMAIL_ENV || (await getSetting('sender_email', SENDER_EMAIL_DEFAULT))
  const from = input.from || `${SENDER_NAME} <${sender}>`
  const replyTo = input.replyTo || REPLY_TO_ENV || (await getSetting('reply_to_email', REPLY_TO_DEFAULT))

  let html = input.html
  if (input.appendFooter !== false) {
    const footer = await getSetting('email_footer_html')
    if (footer) html = `${html}\n${footer}`
  }

  const provider = (await getSetting('email_provider', 'resend')).toLowerCase()
  const send = provider === 'builtin' ? viaBuiltin : viaResend
  try {
    return await send(from, to, input.subject, html, replyTo)
  } catch (e) {
    return { ok: false, id: null, provider, error: String(e) }
  }
}
