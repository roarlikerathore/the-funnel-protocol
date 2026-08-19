// Registers a lead on the webinar platform and returns their personal join link.
//
// OPTIONAL BY DESIGN. If no platform credentials are set, this returns the generic
// join URL from settings and reports ok. A funnel must never fail a registration
// because a webinar integration is missing or misconfigured.
//
// Zoom is implemented. Other platforms slot in behind the same `register` shape.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const ZOOM_ACCOUNT_ID = Deno.env.get('ZOOM_ACCOUNT_ID') || ''
const ZOOM_CLIENT_ID = Deno.env.get('ZOOM_CLIENT_ID') || ''
const ZOOM_CLIENT_SECRET = Deno.env.get('ZOOM_CLIENT_SECRET') || ''

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

/** Server to server OAuth. A fresh token per call: they are cheap and never go stale. */
const zoomToken = async (): Promise<string> => {
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    { method: 'POST', headers: { Authorization: `Basic ${btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`)}` } },
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data?.reason || data?.message || 'Zoom token request failed')
  return data.access_token
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const sb = createClient(SUPABASE_URL, SERVICE_KEY)

    const { data: rows } = await sb.from('site_settings').select('setting_key, setting_value')
    const s: Record<string, string> = {}
    ;(rows || []).forEach((r: any) => { s[r.setting_key] = r.setting_value })

    const fallback = s.join_url || ''
    const platform = (s.webinar_platform || 'zoom').toLowerCase()
    const webinarId = s.webinar_id || ''

    // Not configured is a normal state, not an error.
    if (platform !== 'zoom' || !webinarId || !ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      return json({ ok: true, configured: false, join_url: fallback })
    }

    const email = String(body.email || '').trim().toLowerCase()
    const firstName = String(body.first_name || '').trim()
    if (!email || !firstName) return json({ ok: false, reason: 'email and first_name required' }, 400)

    const token = await zoomToken()
    const res = await fetch(`https://api.zoom.us/v2/webinars/${webinarId}/registrants`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: String(body.last_name || '').trim() || undefined,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      // Log it, but still hand back a usable link. The lead is already saved and
      // must not be left with nothing because Zoom refused.
      console.error('webinar registration failed', data)
      return json({ ok: true, configured: true, registered: false, join_url: fallback, error: data })
    }

    // Their personal link beats the generic one: Zoom can then attribute attendance.
    const joinUrl = data.join_url || fallback
    await sb.from('leads').update({ webinar_join_url: joinUrl }).eq('email', email)

    return json({ ok: true, configured: true, registered: true, join_url: joinUrl })
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500)
  }
})
