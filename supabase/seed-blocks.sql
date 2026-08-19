-- ===========================================================================
-- EMAIL PERSONALISATION BLOCKS
--
-- This is where your emails stop being generic. Each person picked a profile
-- and a challenge when they registered; these blocks are swapped in at send
-- time to match. 6 profiles x 5 challenges = 30 versions of every email.
--
-- Replace every NEEDS-COPY. Match the match_key strings EXACTLY to the values
-- in src/funnel.config.ts - a mismatch silently falls back to 'default'.
--
-- Four tokens:
--   PROFILE_MIRROR  their day, described back to them. No advice, no pitch.
--   CTA_LINE        why turning up matters, for that specific person.
--   PAIN_TWIST      name the struggle, then reframe it as structural.
--   PROOF           why that struggle happens. Reasoning, never invented results.
-- ===========================================================================

INSERT INTO public.email_blocks (token, match_key, body) VALUES

-- ---- PROFILE_MIRROR : one per profile ------------------------------------
('PROFILE_MIRROR', 'PROFILE 1 EXACT TEXT', 'NEEDS-COPY'),
('PROFILE_MIRROR', 'PROFILE 2 EXACT TEXT', 'NEEDS-COPY'),
('PROFILE_MIRROR', 'PROFILE 3 EXACT TEXT', 'NEEDS-COPY'),
('PROFILE_MIRROR', 'PROFILE 4 EXACT TEXT', 'NEEDS-COPY'),
('PROFILE_MIRROR', 'PROFILE 5 EXACT TEXT', 'NEEDS-COPY'),
('PROFILE_MIRROR', 'PROFILE 6 EXACT TEXT', 'NEEDS-COPY'),
-- Used when someone's answer matches nothing. Keep it true for everyone.
('PROFILE_MIRROR', 'default',
 'You did not register because things are going perfectly.
You registered because something about how you are doing this right now is not working.
That is enough to start.'),

-- ---- CTA_LINE : one per profile ------------------------------------------
('CTA_LINE', 'PROFILE 1 EXACT TEXT', 'NEEDS-COPY'),
('CTA_LINE', 'PROFILE 2 EXACT TEXT', 'NEEDS-COPY'),
('CTA_LINE', 'PROFILE 3 EXACT TEXT', 'NEEDS-COPY'),
('CTA_LINE', 'PROFILE 4 EXACT TEXT', 'NEEDS-COPY'),
('CTA_LINE', 'PROFILE 5 EXACT TEXT', 'NEEDS-COPY'),
('CTA_LINE', 'PROFILE 6 EXACT TEXT', 'NEEDS-COPY'),
('CTA_LINE', 'default', 'Block the time. Turn up. That is the whole ask.'),

-- ---- PAIN_TWIST : one per challenge --------------------------------------
('PAIN_TWIST', 'CHALLENGE 1 EXACT TEXT', 'NEEDS-COPY'),
('PAIN_TWIST', 'CHALLENGE 2 EXACT TEXT', 'NEEDS-COPY'),
('PAIN_TWIST', 'CHALLENGE 3 EXACT TEXT', 'NEEDS-COPY'),
('PAIN_TWIST', 'CHALLENGE 4 EXACT TEXT', 'NEEDS-COPY'),
('PAIN_TWIST', 'CHALLENGE 5 EXACT TEXT', 'NEEDS-COPY'),
('PAIN_TWIST', 'default',
 'Most people think the problem is the method.
It is almost never the method.
It is the structure sitting underneath it.'),

-- ---- PROOF : one per challenge -------------------------------------------
-- Reasoning only. No statistics you cannot source, no client results, no
-- case studies. A claim you cannot defend costs more than an empty section.
('PROOF', 'CHALLENGE 1 EXACT TEXT', 'NEEDS-COPY'),
('PROOF', 'CHALLENGE 2 EXACT TEXT', 'NEEDS-COPY'),
('PROOF', 'CHALLENGE 3 EXACT TEXT', 'NEEDS-COPY'),
('PROOF', 'CHALLENGE 4 EXACT TEXT', 'NEEDS-COPY'),
('PROOF', 'CHALLENGE 5 EXACT TEXT', 'NEEDS-COPY'),
('PROOF', 'default',
 'The people who get this right are not more disciplined than you.
They are working inside a structure that makes the right move the easy one.')

ON CONFLICT (token, match_key) DO UPDATE SET body = EXCLUDED.body;

-- Anything still unwritten:
--   SELECT token, match_key FROM public.email_blocks WHERE body = 'NEEDS-COPY';
