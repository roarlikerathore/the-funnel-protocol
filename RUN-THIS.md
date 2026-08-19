# RUN THIS

Two pastes. That is the whole system.

They go into two different apps, which is the only reason it is not one.

---

# PASTE 1 — into Lovable

New project at **lovable.dev** → paste → wait 2 minutes.

```text
Set up a bare skeleton only. Do not design anything. Do not write any copy,
styling, images, or components beyond what is listed here. I will build the
real thing outside Lovable.

1. Enable Lovable Cloud so the project has a database and edge functions.

2. Create these routes, each rendering only an <h1> with its own name and
   nothing else:
   /  /vip  /ip  /thank-you  /thanks  /thanksalot  /preferences
   /terms  /privacy  /refund  /disclaimer  /closed
   /replay1  /replay2  /replay3  /control-room  /win

3. Leave index.css and tailwind.config.ts at their defaults.

Stop after that. Do not add features, do not improve anything, do not
suggest next steps.
```

Then: top right → **GitHub** → **Create Repository**. Copy the URL.

The page will look broken and unstyled. That is correct.

---

# PASTE 2 — into Claude Code

Put your repository URL on the `MY REPO` line. Change nothing else.

```text
Build my webinar funnel using The Funnel Protocol kit. Run the whole thing
end to end and tell me when each stage is done.

MY REPO: https://github.com/PUT-YOURS-HERE/your-project

SETUP
1. Create ~/Documents/Funnels/ if it does not exist. Clone my repo into it.
2. Clone the kit beside it:
   https://github.com/roarlikerathore/the-funnel-protocol
3. Read kit/blueprint/00-BUILD-ORDER.md in full before writing anything. It
   overrides your instincts about how to structure this.
4. Sanity check my repo: a Lovable skeleton, placeholder routes, a supabase
   folder. If it is something else, stop and tell me instead of guessing.

INTERVIEW
5. Work through kit/intake/funnel-brief.md with me. Five questions per message
   at most. Plain language, no jargon. If I say the brief is already filled in,
   read it and only ask about what is blank or contradictory.
6. Write src/funnel.config.ts from my answers, then STOP and show it to me.
   Do not build anything until I have confirmed it.

BUILD
7. Follow the build order, stage by stage. Commit in logical chunks. Push when
   a stage is finished and the build passes.
8. Generate SETUP.sql at the root of my repo: schema, seeds, cron, one file.
   Confirm no {{TOKEN}} survived into it.
9. Run the build. If it fails, fix it. Do not hand me a broken build.

HAND OVER
10. Give me SETUP.sql as a file, with where to paste it.
11. Give me STILL-NEEDED.md: every placeholder still in the funnel.
12. Give me a numbered checklist of what to verify myself, in order, with what
    a correct result looks like for each.

RULES, these matter more than speed
- Lovable only hosts. Never tell me to run a prompt there to build something.
  Every change is a file in GitHub.
- Never invent numbers, testimonials, results or credentials. No real answer
  from me means an obvious placeholder plus a line in STILL-NEEDED.md.
- Never write an API key into anything under src/. Keys live in the hosting
  dashboard's secret store and are read only by edge functions.
- If a session title I give you gives away its own reveal, push back before
  building it. That kills attendance.
- Ask before anything that costs money or sends a real message to a real person.
- Finish every stage you can. Say plainly what you could not do and why. Never
  report the funnel complete while a placeholder is still in it.
```

---

## Then

Claude hands you `SETUP.sql`. Paste it into Lovable's SQL editor, press Run.

Your funnel is live.

---

## The five checks

| | Do | Correct |
|---|---|---|
| 1 | Open `/` | Your copy and colours |
| 2 | Register with your own email | Three steps, then the upsell |
| 3 | Open the Control Room | Your test registration is listed |
| 4 | Wait five minutes | Confirmation email arrives |
| 5 | Meta Events Manager | A `Lead` event appears |

Email is the one that usually fails first, and it is almost always the sending
domain. Claude tells you which DNS records to add. Five minutes, once.
