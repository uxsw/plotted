# Plotted — Design Phase Handover
*Generated end of session — for next chat context*

---

## Project summary
**Plotted** — personal garden plant portfolio web app. Single-user MVP. Mobile-first (~500px max content width, centred, no responsive breakpoints needed). Long-term vision: planning tool with companion planting and AI recommendations.

**Stack:** Next.js (App Router), TypeScript, Tailwind, Supabase (Postgres, Auth, Storage), Vercel. Repo: `github.com/uxsw/plotted`, main branch.

---

## Engineering state (complete)
- Auth (email/password via Supabase), schema with genus/species/cultivar split, CI pipeline, RLS, image upload constraints, server-side validation, name sanitization utility
- Five security fixes applied (open redirect, user_id DB default, delete error handling, generic login errors, defensive update filter)
- Index on `plants.user_id`
- Genus hidden from UI (retained in schema for future auto-population)
- `location` column dropped from schema (migration applied)
- `sun_needs` check constraint updated to include `'full sun / partial shade'`

---

## Design system (implemented and verified at `/design-check`)

### Tokens (in `tailwind.config.ts`)
```
paper:      #FAF6EC
paper-deep: #F2ECDB
ink:        #2B2A24
ink-soft:   #5B574A
moss:       #4F6B4A
moss-deep:  #34492F
moss-tint:  #E2EADD
clay:       #C2603C
clay-tint:  #F3E1D7
sand:       #E8DFC8
sand-line:  #D9CCAC
gold:       #C99A3D
```

### Typography
- Display: **Fraunces** (via `next/font/google`, CSS var `--font-fraunces`) — italic 400 and upright 500/560
- Body/UI: **Inter** (via `next/font/google`, CSS var `--font-inter`)
- Note: Sfizia typeface (atipofoundry.com/fonts/sfizia) under consideration as a future swap for Fraunces — font config is intentionally isolated to one place for easy swapping

### Background
SVG `feTurbulence` paper-grain noise on `body` via `background-image` data URI + `background-blend-mode: multiply`. Applied globally — present on all pages including auth screens.

### Primitive components (in `components/ui/`)
`Button` (primary/secondary/ghost), `Input`, `Select` (Radix), `Card`, `Tag`, `EmptyState`

---

## Implemented pages

### Login (`/login`)
- Botanical plant illustration (tall multi-leaved stem) centred at top
- Wordmark "Plotted" in Fraunces 500 36px
- Tagline "your garden, recorded" in Fraunces italic
- Underline-only inputs (no box) with animated moss focus line
- Labels: Fraunces italic 15px ink-soft lowercase
- Error state: clay-coloured label + underline on password field + inline message below with sprig SVG icon prefix (12×14px, two leaves on stem) — no box, no red
- Footer links: "forgot password?" and "create account" in Fraunces italic moss

### Forgot password + Create account
- **Spec written, not yet implemented** — see `plotted-auth-screens-spec.md`
- Forgot password: flowering stem illustration, tagline "find your way back", single email field, success state replaces form with confirmation copy
- Create account: seedling illustration, tagline "start your garden record", email + password + confirm password fields, password mismatch error uses same sprig icon treatment
- All three auth screens share identical layout pattern — no card, form on paper background

### Add plant (short form)
- Fields: photo, species, cultivar, common name, sun needs (all except species optional)
- Underline-only inputs, Fraunces italic labels 15px
- Species + cultivar in Fraunces italic 18px; common name in Inter 17px
- Botanical fields grouped, 20px gap before common name, 20px gap before sun needs
- Sun needs: 2×2 segmented tile grid (not a select), each tile has inline SVG icon, moss selected state
- Photo zone: moss-tint background, dashed moss border, botanical sprout SVG, "add a photo" label
- On save: navigates to newly created plant detail page
- No cancel button — back link handles abandonment

### Plant detail page
- All fields inline-editable: tap value to edit, save on blur, Escape to revert
- Empty fields shown as tap-to-add prompts ("+ Add notes" etc.) in ink-soft italic
- One field in edit state at a time
- Hover state on editable values: `background-color: rgba(226,234,221,0.6)`, `border-radius: 8px`, `cursor: pointer`, `transition: background-color 120ms ease`
- **Critical pattern:** editable values require `padding: 6px 8px` with `margin-left: -8px` to give hover background breathing room. Without this the background clips to text edge. Documented with correct/incorrect side-by-side in design reference.
- Enrichment fields (date planted, flowering season, height, spread, purchased from, notes) editable here
- "Add another plant" secondary action on this page
- Post-save: stays on detail page

### Plant list/grid
- Fetches active plants (`status = 'active'`), full set, no pagination
- Client-side sort: date planted (default, newest first) or name A–Z
- Auto-fill grid, resolves to single column at mobile width
- Empty state uses `EmptyState` component

---

## Design reference file
`plotted-design-language.html` — static HTML, maintained as visual source of truth for Claude Code. Contains:
- Palette swatches, type scale, buttons, inputs
- Inline editable field pattern with **correct vs incorrect** side-by-side comparison (the padding/margin pitfall)
- Card component, tag variants, empty state

This file should be passed to Claude Code alongside any design-related spec.

---

## Key design patterns / rules

### Inline editable hover (critical — easy to get wrong)
```css
/* ON THE VALUE ELEMENT */
padding: 6px 8px;
margin-left: -8px; /* compensates so text position doesn't shift */
border-radius: 8px;
cursor: pointer;
background-color: transparent;
transition: background-color 120ms ease;

/* ON HOVER */
background-color: rgba(226, 234, 221, 0.6); /* moss-tint at 60% */
```
Never apply the hover background without the padding/margin. Documented in `CLAUDE.md`.

### Underline input focus animation
```css
.field { position: relative; border-bottom: 1px solid var(--sand-line); }
.field::after {
  content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px;
  background: var(--moss); transform: scaleX(0);
  transform-origin: left; transition: transform 200ms ease;
}
.field:focus-within::after { transform: scaleX(1); }
.field:focus-within { border-bottom-color: transparent; }
```

### Error state (auth forms)
- Clay label + underline on affected field
- Inline message below field: Fraunces italic 14px clay, with sprig SVG icon (12×14px) prefixed
- No error box, no red, no background

### Illustration language
- Hand-drawn single-stroke SVG line art, moss colour (`#4F6B4A`)
- Consistent stroke weights: stem 2px, leaves 1.6–1.8px, veins 0.8px at 0.5 opacity
- Soil ellipse (`#E8DFC8`) at base, simple roots extending down
- Each auth screen has its own distinct illustration:
  - Login: tall established plant, multiple leaf pairs
  - Forgot password: flowering stem with open flower + gold centre
  - Create account: seedling, minimal leaves, small bud

---

## Deferred / tracked as GitHub issues
- Slug-based URLs (`/plants/[slug]` instead of UUID)
- Social login (Google/Apple via Supabase — self-contained)
- Shared garden access (couples/households) — depends on social login first
- Private storage bucket + signed URLs — defer until sharing feature
- Automated RLS/ownership test suite — defer until before second user
- Database + Storage backups (currently on Supabase Free — no automatic backups)
- Logo/wordmark — paused pending Sfizia font purchase decision. Two mark directions explored: plot grid (4-quadrant + seedling) and botanical (stem + leaves). Sfizia asterisk has potential as standalone mark.
- Node version bump to Node 22 (Node 20 deprecation warning on GitHub Actions)

---

## Workflow conventions
- Architecture/planning/design → chat (produces specs)
- Implementation → Claude Code using spec `.md` files in `docs/specs/`
- Specs belong in `docs/specs/` if the decision would survive a full tech-stack rewrite (design decisions, product decisions). Implementation-specific fixes live in commit history / GitHub issues.
- Effort levels: low (routine/contained), medium (new patterns, multiple moving parts), high (structural/security). Split prompts by effort level — don't mix in one prompt.
- `/handover` slash command configured in Claude Code for session handover to `.claude-notes/handover.md` (gitignored)
- `CLAUDE.md` contains standing instructions including the inline edit hover pattern rule

---

## Immediate next task
Implement the forgot password and create account screens per `plotted-auth-screens-spec.md` (low effort — login already built, these follow identical pattern with different illustrations and copy).
