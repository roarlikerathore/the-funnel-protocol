import { createClient } from '@supabase/supabase-js'

/**
 * Only these two values may reach the browser. The anon key is designed to be
 * public and is protected by row level security. The service role key must NEVER
 * appear here, in .env, or anywhere under src/.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.error('Supabase is not configured. Copy .env.example to .env and fill both values.')
}

export const supabase = createClient(url ?? '', anon ?? '')
