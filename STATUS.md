# Build status

## Done — the system scaffolding

| File | What it is |
|---|---|
| `README.md` | The six steps, and why Lovable barely participates |
| `prompts/01-lovable-seed.md` | The 1-2 credit seed prompt |
| `prompts/02-claude-bootstrap.md` | The prompt that hands the build to Claude Code |
| `intake/funnel-brief.md` | 10-section brief covering every niche-specific input |
| `blueprint/00-BUILD-ORDER.md` | The build contract Claude Code follows |
| `tutorial/tutorial.html` | The illustrated walkthrough |

## Not done — the template code

The blueprint tells Claude Code *what* to build. It does not yet ship the code
*to* build it from, which means today a build would be generated from scratch:
slower, and different every time.

Next: port the MHP funnel into `templates/`, with every niche-specific string
lifted into `funnel.config.ts`. That is the piece that turns a 2 hour build into
a 15 minute one.

Order to port:
1. `funnel.config.ts` type + the theme deriver
2. `SETUP.sql` — 16 tables, RLS, seeds, cron, as one paste
3. Landing sections + the 3-step registration popup
4. Upsell / downsell / thank-you / replay / legal pages
5. Email engine: 9 templates, 4 block types, the variant resolver
6. Pixel + edge functions
7. Control Room
