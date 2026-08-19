// One place that actually sends email. Every function goes through this.
//
// The provider is a SETTING, not code: site_settings.email_provider.
// Switching is a one line change in the Control Room, no deploy, no rewrite.
//
//   lovable  -> Lovable's own transactional email.  DEFAULT.
//               Uses LOVABLE_API_KEY, which Lovable Cloud sets for you. Nothing
//               to sign up for and no DNS to verify before the first send.
//   resend   -> api.resend.com using RESEND_API_KEY. Needs a verified domain.
//   builtin  -> any HTTP endpoint named by BUILTIN_EMAIL_ENDPOINT. An escape
//               hatch for a provider nobody has thought of yet.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendLovableEmail } from 'npm:@lovable.dev/email-js@0.1.2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') || ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const BUILTIN_ENDPOINT = Deno.env.get('BUILTIN_EMAIL_ENDPOINT') || ''
const BUILTIN_KEY = Deno.env.get('BUILTIN_EMAIL_KEY') || ''

// Sending identity resolves secret -> setting -> empty, so moving domains is a
// settings edit rather than a redeploy.
const SENDER_EMAIL_ENV = Deno.env.get('SENDER_EMAIL') || ''
const REPLY_TO_ENV = Deno.env.get('REPLY_TO_EMAIL') || ''
const SENDER_NAME_ENV = Deno.env.get('SENDER_NAME') || ''

export interface MailInput {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
  /** Groups sends in the provider dashboard. 'transactional' | 'marketing'. */
  purpose?: string
  /** Short label for reporting, usually the template key. */
  label?: string
  /** Same key twice must not send twice. Use the queue row id. */
  idempotencyKey?: string
  /** Global footer from site_settings is appended unless this is false. */
  appendFooter?: boolean
}

export interface MailResult {
  ok: boolean
  id: string | null
  provider: string
  error?: unknown
}

const admin = () => createClient(SUPABASE_URL, SERVICE_KEY)

const allSettings = async (): Promise<Record<string, string>> => {
  try {
    const { data } = await admin().from('site_settings').select('setting_key, setting_value')
    const m: Record<string, string> = {}
    ;(data || []).forEach((r: any) => { m[r.setting_key] = r.setting_value })
    return m
  } catch { return {} }
}

/* ---- providers ---------------------------------------------------------- */

const viaLovable = async (
  from: string, to: string[], subject: string, html: string,
  replyTo: string, senderDomain: string, input: MailInput,
): Promise<MailResult> => {
  if (!LOVABLE_API_KEY) {
    return { ok: false, id: null, provider: 'lovable',
             error: 'LOVABLE_API_KEY is not set. It is provided automatically inside Lovable Cloud.' }
  }
  try {
    const res: any = await sendLovableEmail(
      {
        to: to.join(','),
        from,
        reply_to: replyTo || undefined,
        sender_domain: senderDomain || undefined,
        subject,
        html,
        purpose: input.purpose || 'transactional',
        label: input.label,
        idempotency_key: input.idempotencyKey,
      },
      { apiKey: LOVABLE_API_KEY, sendUrl: Deno.env.get('LOVABLE_SEND_URL') },
    )
    const id = res?.id ?? res?.message_id ?? null
    return { ok: true, id, provider: 'lovable' }
  } catch (e) {
    return { ok: false, id: null, provider: 'lovable', error: String(e) }
  }
}

const viaResend = async (from: string, to: string[], subject: string, html: string, replyTo: string): Promise<MailResult> => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html, reply_to: replyTo || undefined }),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok && !!data?.id, id: data?.id ?? null, provider: 'resend', error: res.ok ? undefined : data }
}

const viaBuiltin = async (from: string, to: string[], subject: string, html: string, replyTo: string): Promise<MailResult> => {
  if (!BUILTIN_ENDPOINT) {
    return { ok: false, id: null, provider: 'builtin', error: 'BUILTIN_EMAIL_ENDPOINT is not set' }
  }
  const res = await fetch(BUILTIN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(BUILTIN_KEY ? { Authorization: `Bearer ${BUILTIN_KEY}` } : {}) },
    body: JSON.stringify({ from, to, subject, html, reply_to: replyTo || undefined }),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, id: data?.id ?? null, provider: 'builtin', error: res.ok ? undefined : data }
}

/* ---- the one entry point ------------------------------------------------ */

export const sendMail = async (input: MailInput): Promise<MailResult> => {
  const s = await allSettings()
  const to = Array.isArray(input.to) ? input.to : [input.to]

  const senderEmail = SENDER_EMAIL_ENV || s.sender_email || ''
  const senderName = SENDER_NAME_ENV || s.host_name || s.brand_name || ''
  const from = input.from || (senderName ? `${senderName} <${senderEmail}>` : senderEmail)
  const replyTo = input.replyTo || REPLY_TO_ENV || s.reply_to_email || ''
  // Bulk mail goes from a subdomain so a spam complaint never poisons the domain
  // the user's real mailbox sits on.
  const senderDomain = s.sending_subdomain || senderEmail.split('@')[1] || ''

  let html = input.html
  if (input.appendFooter !== false && s.email_footer_html) html += `\n${s.email_footer_html}`

  const provider = (s.email_provider || 'lovable').toLowerCase()
  try {
    if (provider === 'resend') return await viaResend(from, to, input.subject, html, replyTo)
    if (provider === 'builtin') return await viaBuiltin(from, to, input.subject, html, replyTo)
    return await viaLovable(from, to, input.subject, html, replyTo, senderDomain, input)
  } catch (e) {
    return { ok: false, id: null, provider, error: String(e) }
  }
}
