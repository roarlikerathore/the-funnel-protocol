// Email open + click tracking.
//
//   GET /email-track/open?t=<template>&c=<campaign>&e=<email>&f=<framework>&s=<sequence>
//        -> logs an open, returns a 1x1 transparent GIF
//   GET /email-track/click?u=<encoded url>&t=&c=&e=&f=&s=
//        -> logs a click, then 302s to the real destination
//
// Open tracking is deliberately treated as a soft signal: Apple Mail Privacy Protection
// pre-loads images for a large share of recipients, which inflates opens. Click and
// click-to-open are the numbers to trust when deciding which emails to rewrite.
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// 1x1 transparent GIF
const PIXEL = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), (c) => c.charCodeAt(0))

const log = async (row: Record<string, unknown>) => {
  try {
    await createClient(SUPABASE_URL, SERVICE_KEY).from('email_events').insert(row)
  } catch { /* never block the reader */ }
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const kind = url.pathname.split('/').pop()
  const q = url.searchParams
  const base = {
    template_key: q.get('t') || null,
    campaign: q.get('c') || null,
    to_email: (q.get('e') || '').toLowerCase() || null,
    framework: q.get('f') || null,
    sequence_key: q.get('s') || null,
    user_agent: req.headers.get('user-agent'),
  }

  if (kind === 'click') {
    const { data: siteRow } = await sb.from('site_settings').select('setting_value').eq('setting_key','site_url').maybeSingle()
    const home = siteRow?.setting_value || '/'
    const dest = q.get('u') ? decodeURIComponent(q.get('u')!) : home
    // Only ever redirect to our own properties, so this cannot be used as an open redirect.
    // Open redirect guard: only the user's own domain and its subdomains.
    const host = home.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')
    const allowed = !!host && new RegExp(`^https://([a-z0-9-]+\\.)*${host.replace(/\./g, '\\.')}/`, 'i').test(dest)
    const target = allowed ? dest : home
    await log({ ...base, event: 'click', link_url: target })
    return new Response(null, { status: 302, headers: { Location: target, 'Cache-Control': 'no-store' } })
  }

  await log({ ...base, event: 'open' })
  return new Response(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    },
  })
})
