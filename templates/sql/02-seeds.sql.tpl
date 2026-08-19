-- ===========================================================================
-- SEEDS  —  every {{TOKEN}} is replaced from src/funnel.config.ts before this ships.
-- If a {{TOKEN}} survives into the user's SETUP.sql, that is a build bug.
-- ===========================================================================

INSERT INTO public.site_settings (setting_key, setting_value) VALUES
  ('brand_name',              '{{BRAND_NAME}}'),
  ('host_name',               '{{HOST_NAME}}'),
  ('support_email',           '{{SUPPORT_EMAIL}}'),
  ('event_name',              '{{EVENT_NAME}}'),
  ('event_date',              '{{EVENT_DATE}}'),
  ('event_time',              '{{EVENT_TIME}}'),
  ('event_timezone',          '{{EVENT_TIMEZONE}}'),
  ('event_days',              '{{EVENT_DAYS}}'),
  ('join_url',                '{{JOIN_URL}}'),
  ('registration_open',       'true'),
  -- Long enough for the upsell and downsell to resolve, so the confirmation
  -- knows what the person actually bought before it decides what to say.
  ('confirm_delay_minutes',   '{{CONFIRM_DELAY}}'),
  -- Bulk mail from a subdomain; replies to the real inbox, which has an MX record.
  ('sender_email',            '{{SENDER_EMAIL}}'),
  ('reply_to_email',          '{{SUPPORT_EMAIL}}'),
  ('email_provider',          'resend'),
  ('whatsapp_enabled',        '{{WA_ENABLED}}'),
  ('whatsapp_provider',       '{{WA_PROVIDER}}'),
  ('calls_enabled',           '{{CALLS_ENABLED}}'),
  ('calls_lead_time_minutes', '{{CALLS_LEAD_TIME}}'),
  ('calls_country_code',      '{{CALLS_COUNTRY}}'),
  ('backoffice_webhook_url',  ''),          -- empty means off. See build order stage 9.
  ('email_footer_html',       '{{EMAIL_FOOTER}}')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

INSERT INTO public.page_toggles (path, enabled) VALUES
  ('/', true), ('/vip', {{HAS_UPSELL}}), ('/ip', {{HAS_DOWNSELL}}),
  ('/replay1', false), ('/replay2', false), ('/replay3', false), ('/closed', false)
ON CONFLICT (path) DO NOTHING;

INSERT INTO public.email_sequences (key, name, description, sort_order) VALUES
  ('event_first',     'Event - First timers', 'Registration through to post event', 10),
  ('event_returning', 'Event - Returning',    'Registered before: welcome back',    11)
ON CONFLICT (key) DO NOTHING;

-- Personalisation blocks: one row per (token, answer). The renderer falls back to
-- 'default' for anything unmatched, so a missing row degrades instead of breaking.
{{EMAIL_BLOCKS}}

-- The 9 email templates.
{{EMAIL_TEMPLATES}}

-- WhatsApp templates, seeded as 'draft'. They do not send until Meta approves them
-- and the user sets approval_status to 'approved'.
{{WHATSAPP_TEMPLATES}}
