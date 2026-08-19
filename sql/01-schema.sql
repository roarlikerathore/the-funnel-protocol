-- ===========================================================================
-- FUNNEL SCHEMA
-- Safe to run more than once. Every statement is IF NOT EXISTS or idempotent.
-- ===========================================================================

-- --- Settings --------------------------------------------------------------
-- WORLD READABLE. The browser reads this with the anon key.
-- An API key, token or secret NEVER goes in this table. Use admin_secrets.
CREATE TABLE IF NOT EXISTS public.site_settings (
  setting_key   TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL DEFAULT '',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read settings"   ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "write settings"  ON public.site_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "insert settings" ON public.site_settings FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.page_toggles (
  path       TEXT PRIMARY KEY,
  enabled    BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.page_toggles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read toggles"  ON public.page_toggles FOR SELECT USING (true);
CREATE POLICY "write toggles" ON public.page_toggles FOR ALL USING (true) WITH CHECK (true);

-- --- Secrets ---------------------------------------------------------------
-- RLS ON, NO POLICIES AT ALL. That combination means only the service role can
-- read it, so edge functions can and the browser cannot. Do not add a policy.
CREATE TABLE IF NOT EXISTS public.admin_secrets (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_secrets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.admin_otp (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  code_hash  TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  -- Six digits is 1,000,000 guesses. Without a counter that is a weekend's work.
  attempts   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_email ON public.admin_otp (email, created_at DESC);
ALTER TABLE public.admin_otp ENABLE ROW LEVEL SECURITY;

-- --- Leads and analytics ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  first_name   TEXT NOT NULL DEFAULT '',
  last_name    TEXT,
  country_code TEXT,
  phone        TEXT,
  profile      TEXT,                       -- one of config.audience.profiles
  challenge    TEXT,                       -- one of config.audience.challenges
  visitor_id   TEXT,
  whatsapp_opted_in BOOLEAN NOT NULL DEFAULT false,
  -- Their personal join link, when the webinar platform issues one. Attendance
  -- can only be attributed back to a person if they use their own link.
  webinar_join_url TEXT,
  utm_source   TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email)
);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads (created_at DESC);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "read leads"   ON public.leads FOR SELECT USING (true);
CREATE POLICY "update leads" ON public.leads FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.page_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL, session_id TEXT NOT NULL, path TEXT NOT NULL,
  referrer   TEXT, device TEXT,
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_views_created ON public.page_views (created_at DESC);
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "read views"   ON public.page_views FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.funnel_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT, event TEXT NOT NULL, profile TEXT, challenge TEXT,
  meta       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_funnel_event ON public.funnel_events (event, created_at DESC);
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert funnel" ON public.funnel_events FOR INSERT WITH CHECK (true);
CREATE POLICY "read funnel"   ON public.funnel_events FOR SELECT USING (true);

-- The checkout provider has no webhook, so a sale is recorded when the buyer lands
-- on the page it redirects to only after payment. The unique index means a refresh
-- or a bookmark cannot double count.
CREATE TABLE IF NOT EXISTS public.conversions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT, visitor_id TEXT,
  product     TEXT NOT NULL,             -- upsell | downsell
  amount      NUMERIC NOT NULL DEFAULT 0,
  currency    TEXT NOT NULL DEFAULT 'INR',
  source_path TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS conversions_unique_sale ON public.conversions (lower(email), product);
CREATE INDEX IF NOT EXISTS idx_conversions_email ON public.conversions (lower(email), created_at DESC);
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert conv" ON public.conversions FOR INSERT WITH CHECK (true);
CREATE POLICY "read conv"   ON public.conversions FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.referrals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_email TEXT NOT NULL, referred_email TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referrer_email, referred_email)
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert refs" ON public.referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "read refs"   ON public.referrals FOR SELECT USING (true);

-- --- Email engine ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true, sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL, name TEXT NOT NULL,
  subject TEXT NOT NULL, preheader TEXT, html TEXT NOT NULL,
  framework TEXT NOT NULL DEFAULT 'story',       -- hso | sos | story | logic
  audience  TEXT NOT NULL DEFAULT 'all',         -- all | attended | absent
  variant_group TEXT,                            -- alternatives; one wins at send time
  variant_match TEXT,                            -- none | upsell | downsell
  schedule_anchor TEXT NOT NULL DEFAULT 'signup',-- signup | event_start | event_end | deadline
  offset_minutes  INT  NOT NULL DEFAULT 0,
  absolute_send_at TIMESTAMPTZ,
  sort_order INT NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (sequence_id, template_key)
);
CREATE INDEX IF NOT EXISTS idx_tpl_variant ON public.email_templates (variant_group, variant_match);

-- One row per (token, key). Rendered into templates at send time.
-- 6 profiles x 5 challenges from one template = 30 versions.
CREATE TABLE IF NOT EXISTS public.email_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,          -- PROFILE_MIRROR | PAIN_TWIST | PROOF | CTA_LINE
  match_key TEXT NOT NULL,      -- the exact dropdown value, or 'default'
  body TEXT NOT NULL,
  UNIQUE (token, match_key)
);

CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID, template_key TEXT,
  to_email TEXT NOT NULL, to_name TEXT,
  subject_snapshot TEXT, html_snapshot TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | sent | failed | cancelled
  attempts INT NOT NULL DEFAULT 0,
  provider_id TEXT, last_error TEXT, sent_at TIMESTAMPTZ,
  sequence_key TEXT, profile TEXT, challenge TEXT, variant_group TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_queue_due ON public.email_queue (status, scheduled_at);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID, to_email TEXT, template_key TEXT, subject TEXT,
  status TEXT, provider_id TEXT, error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  unsubscribed BOOLEAN NOT NULL DEFAULT false,
  event_emails BOOLEAN NOT NULL DEFAULT true,
  nurture_emails BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT, framework TEXT, sequence_key TEXT, campaign TEXT, landing_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --- WhatsApp --------------------------------------------------------------
-- Mirrors the email engine on purpose. Same shapes, same worker pattern.
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  -- Meta must approve business-initiated templates in advance. Until this is
  -- 'approved', the worker skips the row rather than failing the send.
  approval_status TEXT NOT NULL DEFAULT 'draft',   -- draft | submitted | approved | rejected
  provider_template_name TEXT,
  schedule_anchor TEXT NOT NULL DEFAULT 'signup',
  offset_minutes INT NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.whatsapp_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT, to_phone TEXT NOT NULL, to_name TEXT,
  body_snapshot TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  provider_id TEXT, last_error TEXT, sent_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_due ON public.whatsapp_queue (status, scheduled_at);

CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID, to_phone TEXT, template_key TEXT,
  status TEXT, provider_id TEXT, error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --- Calls -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT, phone TEXT, first_name TEXT,
  purpose TEXT NOT NULL DEFAULT 'reminder',
  status TEXT NOT NULL DEFAULT 'queued',   -- queued | dialling | done | failed
  provider_id TEXT, duration_seconds INT, error TEXT,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_calls_due ON public.call_logs (status, scheduled_at);

-- --- RLS for the machine tables --------------------------------------------
-- Read for the admin dashboard, insert for the app. Writes that matter happen
-- through edge functions with the service role, which bypasses all of this.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'email_sequences','email_templates','email_blocks','email_queue','email_logs',
    'email_preferences','email_link_clicks','whatsapp_templates','whatsapp_queue',
    'whatsapp_logs','call_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "read %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "read %1$s" ON public.%1$I FOR SELECT USING (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "write %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "write %1$s" ON public.%1$I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
