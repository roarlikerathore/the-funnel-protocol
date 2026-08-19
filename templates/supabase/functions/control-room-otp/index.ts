// Control Room OTP login.
//   { action: "request", email }        -> emails a 6 digit code to an allow-listed address
//   { action: "verify", email, code }   -> { ok: true } when the code matches
//
// The code never leaves the server in the response. Codes are hashed, single use,
// expire in 10 minutes, and allow 5 attempts.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendMail } from '../_shared/mailer.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const TTL_MS = 10 * 60_000
const MAX_ATTEMPTS = 5

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const sha256 = async (v: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const otpEmail = (code: string) => `
<div style="font-family:'Montserrat',Arial,sans-serif;background:#141414;padding:32px;">
  <div style="max-width:460px;margin:0 auto;background:#1F1F1F;border:1px solid #C9A22740;border-radius:12px;padding:28px;text-align:center;">
    <p style="color:#C9A227;font-weight:900;letter-spacing:2px;font-size:12px;margin:0 0 12px;">CONTROL ROOM</p>
    <p style="color:#F2F2F2;font-size:15px;margin:0 0 20px;">Your login code:</p>
    <p style="font-size:38px;font-weight:900;letter-spacing:10px;color:#C9A227;margin:0;">${code}</p>
    <p style="color:#A6A6A6;font-size:12px;margin:20px 0 0;">Valid for 10 minutes. If this was not you, ignore this email.</p>
  </div>
</div>`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { action, email, code } = await req.json()
    const addr = String(email || '').trim().toLowerCase()
    if (!addr) return json({ ok: false, reason: 'email required' }, 400)

    const sb = createClient(SUPABASE_URL, SERVICE_KEY)
    const { data: row } = await sb.from('site_settings')
      .select('setting_value').eq('setting_key', 'control_room_admin_emails').maybeSingle()
    const allowed = (row?.setting_value || '').split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean)

    // Same response whether or not the address is allow-listed, so this cannot be used
    // to discover which emails are admins.
    if (action === 'request') {
      if (allowed.includes(addr)) {
        const generated = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0')
        await sb.from('admin_otp').insert({
          email: addr,
          code_hash: await sha256(generated),
          expires_at: new Date(Date.now() + TTL_MS).toISOString(),
        })
        await sendMail({
          to: addr,
          subject: `${generated} is your Control Room code`,
          html: otpEmail(generated),
          appendFooter: false,
        })
      }
      return json({ ok: true, sent: true })
    }

    if (action === 'verify') {
      const supplied = String(code || '').trim()
      if (!/^\d{6}$/.test(supplied)) return json({ ok: false, reason: 'invalid code' })

      const { data: rec } = await sb.from('admin_otp')
        .select('id, code_hash, expires_at, used_at, attempts')
        .eq('email', addr).order('created_at', { ascending: false }).limit(1).maybeSingle()

      if (!rec || rec.used_at) return json({ ok: false, reason: 'invalid code' })
      if (new Date(rec.expires_at).getTime() < Date.now()) return json({ ok: false, reason: 'code expired' })
      if (rec.attempts >= MAX_ATTEMPTS) return json({ ok: false, reason: 'too many attempts' })

      const match = (await sha256(supplied)) === rec.code_hash
      await sb.from('admin_otp')
        .update(match ? { used_at: new Date().toISOString() } : { attempts: rec.attempts + 1 })
        .eq('id', rec.id)

      return json(match ? { ok: true } : { ok: false, reason: 'invalid code' })
    }

    return json({ ok: false, reason: 'unknown action' }, 400)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
