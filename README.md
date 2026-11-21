# Bridgework

An AI-powered career-transition planner for working professionals in India. It turns a resume into an evidence ledger, compares realistic routes into eight destination roles under the user's own time, money and income limits, drafts a week-by-week plan, builds and grades proof-of-capability projects, and replans after setbacks.

## How AI and code divide the work

| Step | The model does | Code does |
|---|---|---|
| Intake | Maps resume lines to 38 capabilities, quotes evidence | Verifies every quote against the resume; unverifiable claims are downgraded |
| Follow-ups | Writes targeted questions for weak, high-weight skills | Picks which skills are weak from role weights |
| Answers | Upgrades or adds claims with verbatim quotes | Verifies quotes again |
| Role fit | Explains fit, recruiter doubt, first proof | Coverage score, band, gap hours |
| Routes | (none) | Time, hours, cash, lost income, constraint flags, ranking, "what would flip" |
| Plan | Drafts ordered milestones from real projects | Schedules into weeks at 85% of available hours; versioned replans |
| Proof | Writes brief and rubric; grades submissions | Adds strong criteria to the ledger, recomputes fits |
| Check-in | Ranks causes (channel and positioning before skills) | Inserts actions into a new plan version |

AI provider: **Google Gemini free tier** when `GEMINI_API_KEY` is set (no card; Google may use free-tier prompts to improve its products, which the Account page discloses), or Anthropic Claude when only `ANTHROPIC_API_KEY` is set. Structured output uses JSON schemas validated with Zod, with one retry; unknown model IDs fall back through a list. Every call is logged on the Account page.

## Stack

Next.js 16 (App Router, TypeScript, Tailwind 4), Postgres via `postgres`, email/password and guest auth with signed httpOnly cookies (`jose`, `bcryptjs`), Anthropic SDK, `unpdf` for PDF text. Tables are created automatically on first request.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

`AI_MOCK=1` in `.env.local` returns fixtures instead of calling the API (development only; ignored in production, and a banner shows when it is on).

## Deploy (Vercel + Neon, about 15 minutes)

1. Push this folder to a GitHub repository.
2. In Vercel, **Add New > Project**, import the repository. Framework: Next.js (auto-detected).
3. In the project's **Storage** tab, create a **Neon Postgres** database and connect it to the project. This adds `DATABASE_URL`.
4. In **Settings > Environment Variables** add:
   - `GEMINI_API_KEY`: free, from https://aistudio.google.com/apikey (no card)
   - `SESSION_SECRET`: any random string of 32+ characters
5. **Deployments > Redeploy**. Open the URL and click "Try it without an account".

Any Postgres 14+ works (Supabase: use the pooled connection string).

## Data and limits

- Role cards, skill weights, hour estimates and salary ranges are curated demo data, labelled as such in the UI.
- Course prices carry a source and date (checked 21 Nov 2026); see `/method`.
- No hiring probabilities, by design. No live job-posting feed yet.
- Sample personas are fictional; switch stories on `/stories` are real public sources, mostly provider-published.

## Design and third-party components

Cinematic landing (night hero with WebGL cables, scroll-driven text reveal, sticky product story, story marquee); the product screens stay light and functional.

| Component | Source | Licence | Where |
|---|---|---|---|
| Threads (WebGL), Noise, BlurText | React Bits | MIT + Commons Clause: free in apps, not resellable as components | Hero |
| TextReveal, Marquee, NumberTicker, Safari frame | Magic UI | MIT | Problem statement, stories, live figures, product frames |
| Sticky scroll reveal pattern | After Aceternity UI (free component) | Rebuilt from scratch with Motion | "The crossing" section |

Framer Marketplace templates were used as reference only: they are Framer-site templates and cannot be imported into a Next.js codebase. Licence texts are in `src/components/vendor/`. Product screenshots in `public/screens` were captured from this app with a fictional sample profile.
