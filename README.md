# SentriBiD — frontend

React + TypeScript + Vite + Tailwind. Talks to the FastAPI backend in
`sentribid-backend`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
```

Set `VITE_API_BASE_URL` in `.env` to point at the backend. It falls back to
`http://127.0.0.1:8000`.

---

## How the app is laid out

Five destinations, and they never change between screens:

| Route | Screen | What it's for |
|---|---|---|
| `/` | Dashboard | What's open, what's due, what's waiting on a decision |
| `/find-work` | Find Work | Search SAM.gov · Matched for me · Teaming partners |
| `/pipeline` | Pipeline | Kanban board from first look to won or lost |
| `/bids` | My Bids | Opportunities and bids in one filterable table |
| `/settings` | Settings | Company profile, industry codes, SAM.gov key |

Plus the detail screens: `/bids/new` (upload wizard), `/bids/:id`,
`/bids/:id/edit`, `/opportunities/:id`, `/war-room/:id`, `/export/:versionId`.

Old URLs (`/discover`, `/sam-search`, `/subcontract-scout`, `/autopilot`,
`/profile`) redirect to their new homes, so existing links keep working.

## The rules the UI follows

These are what keep the app from drifting back into being noisy.

**Every page states what it's for.** `<Page>` takes a required `summary` prop —
one plain sentence under the title. It's required on purpose: if a new screen
can't be described in a sentence, that's a sign it's doing too much.

**One accent colour.** Indigo (`brand-600`) marks the primary action, the active
nav item and links. Nothing else is indigo. Status colours (`good` / `warn` /
`bad`) only ever appear inside small badges, dots and thin bars — never as a
card background or a heading.

**One primary button per screen.** Everything else is a white button with a grey
border, or a plain text link.

**Plain language, not procurement jargon.** "Win chance", not "P-win". "Turn
into a bid", not "convert". Reference codes (`SB-2026-…`) live under the title
in 11px grey mono, never in the primary slot.

**Icons are inline SVG**, from `lucide-react`, mapped by name in
`src/ui/icons.ts`. No icon webfont — a font that loads slowly renders its own
ligature names as visible text, which is exactly the sort of thing that makes an
app look unfinished.

**Numbers get formatted in one place.** `src/lib/format.ts` owns every
conversion from API value to readable string. In particular `toPercent()` fixes
the old bug where the same score rendered as `0.85%` on one screen and `85%` on
another — the API returns both 0–1 floats and 0–100 integers, so nothing formats
a raw score directly any more.

## Where things live

```
src/
  components/
    AppLayout.tsx    sidebar + top bar + mobile tab bar
    AuthLayout.tsx   the signed-out shell
    Page.tsx         page title, required summary, actions, back link
    RequireAuth.tsx  redirects to /login, remembers where you were going
  ui/
    kit.tsx          Button, Card, Badge, Field, Tabs, EmptyState, …
    icons.ts         name → lucide component map
  lib/
    api.ts           axios instance, bearer token, 401 handling
    auth.ts          token storage
    format.ts        money, percentages, dates, deadlines, status words
  pages/             one file per screen
```

Design tokens (colour, type scale, spacing, radii, shadows) are all in
`tailwind.config.js`. Change them there, not in components.

## Known gaps

- Equipment rows can be added and removed but not edited in place — the backend
  has no PATCH for `/bids/:id/equipment`.
- The Pipeline board moves cards optimistically and reloads if the PUT fails.
- `/auth/reset-password` returns the temporary password in the response body and
  the UI shows it on screen. It isn't emailed.
