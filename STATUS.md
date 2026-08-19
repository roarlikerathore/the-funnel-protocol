# Build status

## Done — the system scaffolding

| File | What it is |
|---|---|
| `RUN-THIS.md` | **The single executable.** Two prompts, nothing else |
| `README.md` | What it is, and why Lovable barely participates |
| `prompts/01-lovable-seed.md` | The 1-2 credit seed prompt |
| `prompts/02-claude-bootstrap.md` | The prompt that hands the build to Claude Code |
| `intake/funnel-brief.md` | 10-section brief covering every niche-specific input |
| `blueprint/00-BUILD-ORDER.md` | The build contract Claude Code follows |
| `tutorial/tutorial.html` | The illustrated walkthrough |
| `REPO-MODEL.md` | How a buyer's repo stays sealed off from the live one |
| `scripts/scan-for-leaks.sh` | Fails the build if anything private survived the port |

## Done — the spine of the template

| File | What it is |
|---|---|
| `templates/src/funnel.config.ts` | The typed schema every page and email reads from |
| `templates/sql/01-schema.sql` | 20 tables, RLS, indexes. Static, niche-agnostic |
| `templates/sql/02-seeds.sql.tpl` | Settings, sequences, blocks. Tokens filled from config |
| `templates/sql/03-cron.sql.tpl` | Four scheduled jobs |

Concatenated by the build into a single `SETUP.sql` the user pastes once.

## Not done — the React and function layer

Order to port:
1. Theme deriver: config colours to CSS custom properties
2. Landing sections + the 3-step registration popup
4. Upsell / downsell / thank-you / replay / legal pages
5. Email engine: 9 templates, 4 block types, the variant resolver
6. WhatsApp queue + provider adapters + the templates to submit to Meta
7. AI calling, with the plain-language script that survives moderation
8. Pixel + edge functions
9. Control Room
10. Back office webhook seam, shipped switched off
