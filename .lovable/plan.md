# Ultimate Creator Studio — Phased Rebuild

Renaming the app from "Fabuos Creators / YT Manager" to **Ultimate Creator Studio**, rebuilding the shell, IA, and dashboard, then layering the Growth Engine + AI Channel Intelligence on top. **No working features get broken** — Instagram OAuth, YouTube upload, payments, all AI tools stay intact. We just reorganize, redesign, and add new growth surfaces.

You picked: phased rebuild, keep all existing tools (only declutter inside the YT Studio area), no specific aesthetic. I'll use a **Linear / Notion-grade dark minimal** system as the default since you specifically named those products as the bar.

---

## Visual System (locked Phase 1, used everywhere after)

- **Surfaces:** near-black `hsl(240 10% 4%)` base, raised `hsl(240 8% 7%)` cards, hairline `hsl(240 6% 14%)` borders
- **Accent:** electric violet `hsl(258 90% 66%)` — single accent, used sparingly
- **Type:** Inter Tight for headings, Inter for body, JetBrains Mono for numbers/metrics
- **Density:** 8px grid, generous whitespace, 12px radii on cards, 8px on inputs
- **Motion:** 120ms ease-out for hover/press, 240ms cubic-bezier for route enter, no bounce
- **Components:** rebuild via shadcn variants — no per-component custom colors

---

## Phase 1 — Foundation (this loop)

Goal: app *feels* like a different product the moment you load it. Zero backend changes.

1. **Rename** "Fabuos Creators" → **Ultimate Creator Studio** in the sidebar, page titles, meta tags
2. **New design tokens** in `index.css` + `tailwind.config.ts` (the system above)
3. **Rebuilt sidebar** with smart grouping:
   - **Growth** *(new)* — Dashboard, Growth Engine, Channel DNA, Trends
   - **YouTube** — Manager, Upload Studio, Comments
   - **Instagram** — Manager, Auto-DM
   - **Create** — Thumbnails, Scripts, Captions, Hashtags, SEO, Music
   - **AI Tools** — TTS, Voice Cloning, Dubbing, Speech-to-Text, BG Remove, Image Enhance, Face Swap, Summarizer, Helper Bot, You Research, Dr. Fabuos
   - **Account** — Settings, Pricing
4. **Redesigned dashboard** (`/dashboard`) — clean hero with Growth Score placeholder, 3 connected-account cards (YouTube / Instagram / status), "What to do next" action cards, recent activity
5. **Growth Engine landing** (`/growth`) — 10 module cards (DNA, Viral Intel, Strategist, Title/Hook, Retention, Trend Match, Competitor, Upload Optimizer, Gap Detector, Score). All show "Connect channel to unlock" until Phase 3.

Acceptance: nothing existing breaks, sidebar groups are obvious, dashboard loads instantly with skeletons, app reads as "Ultimate Creator Studio" everywhere.

---

## Phase 2 — Tool page polish + perf (next loop)

- Apply the new design system to every existing tool page (consistent headers, empty states, skeletons)
- Declutter **YouTube Manager**: collapse 7 tabs → 4 (Library, Schedule, Bulk, Analytics); move Performance into Analytics
- Add route-level code-split prefetching, optimistic loading, React Query stale-while-revalidate everywhere
- Fix the slow-load complaints: skeleton states on every page, no more blank flashes

---

## Phase 3 — Growth Engine v1 (the real product)

Build the 10 systems you specified, all driven by **one shared backend brain**:

### New backend
- **`channel_dna_profiles` table** — niche, sub-niches, content style, audience, viral patterns, weaknesses, strongest topics, best upload times, best length, best hooks, best title styles, content pillars (all JSONB)
- **`competitor_channels` table** — user-added competitor list per user
- **`growth_scores` table** — CTR / retention / consistency / thumbnail / hook / trend / engagement / SEO scores + biggest bottleneck text
- **`content_recommendations` table** — generated ideas with viral-potential score, topic, format, hook, status (new/saved/dismissed)

### New edge functions (all use Lovable AI Gateway, gemini-3-flash-preview default, gpt-5 for deep analysis)
- `analyze-channel-dna` — pulls last 50 videos via YouTube Data API + IG media, runs structured-output extraction → writes to `channel_dna_profiles`
- `viral-video-intelligence` — picks top 5 videos, asks AI to extract success patterns
- `generate-content-strategy` — produces personalized ideas using DNA + trends
- `optimize-title-hook` — paste a title/hook, get 5 alternatives scored against the user's DNA
- `analyze-retention` — uses YT Analytics API retention curves to find drop-off points + fixes
- `match-trends` — trend feed filtered by DNA niche
- `competitor-intel` — periodically scans saved competitors for what's working
- `compute-growth-score` — runs nightly cron, writes scores + bottleneck

### New pages
- `/growth/dna` — Channel DNA Profile (clean readable summary, not a dashboard)
- `/growth/intel` — Success Pattern Report
- `/growth/ideas` — AI Content Strategist (idea feed, save/dismiss)
- `/growth/optimizer` — Title/Hook/Thumbnail rewriter
- `/growth/retention` — retention drop-off finder
- `/growth/trends` — trend matching
- `/growth/competitors` — add competitors, see opportunities
- `/growth/score` — Growth Score with the one-line bottleneck call-out

UX rule: **every screen ends with one specific action**, never raw analytics dumps.

---

## Phase 4 — Polish + intelligence loop

- Onboarding flow: connect YT → wait while DNA computes → land on personalized dashboard
- Weekly "Growth Report" email via Resend
- Notification when Growth Score changes meaningfully
- Mobile pass on every page

---

## Out of scope (not building)

- Removing any existing AI tools (you said keep them)
- Replacing payments / auth / Instagram OAuth
- Any agentic auto-posting beyond what already exists

---

## Risks I'm watching

- **YouTube Data API quota** — DNA analyzer pulls a lot; cache aggressively in `channel_dna_profiles` and only re-run weekly
- **Lovable AI cost** — DNA + viral intel use long context; gate behind explicit "Analyze my channel" button, not auto-run
- **Bundle size** — already a concern per memory; Phase 2 includes a code-split audit

After your approval I start Phase 1 immediately and ship it this loop.