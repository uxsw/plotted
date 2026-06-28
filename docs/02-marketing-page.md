# Prompt 2 — Marketing page implementation

**Effort: high. Full marketing page build against the design reference.**

---

## Context

The design reference is in `Plotted Homepage.dc.html` (in this directory). Open it in a browser to preview the design. Read its source to see exact inline styles and copy. **Do not port the `.dc.html` mechanics** — it uses a bespoke `<x-dc>` runtime that doesn't exist in the codebase. Recreate the design faithfully in React/Next.js using the specs below.

The full design handover is in `README.md` alongside this file. Read it in full before writing any code. This prompt adds production-specific instructions that override or extend the handover where noted.

---

## File location

Implement in `app/(marketing)/page.tsx`, replacing the placeholder from Prompt 1.

Split into sub-components in `app/(marketing)/_components/` as needed for readability. These are page-private components — do not put them in `src/components/`.

---

## Fonts

The marketing page introduces a third font: **Spline Sans Mono** (used for eyebrows, mono labels, captions).

Add it to the **root layout** (`app/layout.tsx`) alongside Fraunces and Inter:

```ts
import { Fraunces, Inter, Spline_Sans_Mono } from "next/font/google";

const splineSansMono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-spline-mono",
});
```

Add `${splineSansMono.variable}` to the `<html>` className. Use `var(--font-spline-mono)` or a Tailwind utility class for mono elements on the marketing page.

---

## Design tokens

Use the exact values from the handover `README.md`. Where tokens overlap with the existing app design system (paper, moss, ink etc.), use the existing Tailwind classes. For marketing-specific tokens not in the existing system, use inline styles or extend Tailwind config — don't pollute the global design system with marketing-only tokens.

---

## Sections to implement

All 8 sections as specified in the handover README. In order:

1. Header / Nav
2. Hero
3. Features
4. Product demo (see below)
5. Demo copy + status pill
6. Ethos
7. Request access form (UI only — no submission logic, that's Prompt 3)
8. Footer

---

## Photography placeholders

Every image is a striped placeholder. Use this CSS for the fill:

```css
background: repeating-linear-gradient(135deg, #E6D9BD 0 13px, #EEE3CB 13px 26px);
```

Add a centred mono label on each placeholder indicating the required aspect ratio and slot name, e.g. "HERO PHOTO · 3:4", "ETHOS PHOTO · 4:3", "PLANT TILE · 1:1". This makes it easy to drop real photos in later.

Required image slots and aspect ratios:
- Hero portrait: **3:4**
- Product section landscape: **16:6.5**
- Ethos portrait: **4:3**
- In-app plant tiles (6 cards in the demo): **1:1**

---

## Product demo

Pure CSS/JS animated mockup — non-interactive, infinite loop. Implement as a self-contained React component using `useState` + `useEffect` with `setInterval`/`setTimeout`. No external animation library for the demo itself.

The demo renders a phone frame containing a simulated version of the Plotted UI. All content is static/hardcoded — no real data fetching.

### Demo phases (from handover README)

| Phase | Duration | Caption |
|---|---|---|
| 1. Grid view | 2.6s | "Browsing the collection" |
| 2. Filter: Full sun | 2.5s | "Filtering by sun" |
| 3. Clear filter | 1.1s | "Browsing the collection" |
| 4. Open add sheet | 0.9s | "Adding a new plant" |
| 5. Type species | ~80ms/char | "Adding a new plant" |
| 6. Lookup loading | 1.3s | "Looking up the details" |
| 7. Lookup result | 2.6s | "Details found automatically" |
| 8. Saved to garden | 2.9s | "Saved to your garden" |
| 9. Loop | — | — |

Demo plant data:
- Rosa 'Gertrude Jekyll' — Climbing rose · Full sun · in bloom
- Salvia nemorosa — Perennial · Full sun
- Lavandula — Shrub · Full sun · in bloom
- Geranium 'Rozanne' — Perennial · Part shade · in bloom
- Alchemilla mollis — Perennial · Part shade
- Hosta 'Frances' — Foliage · Shade
- New plant added: **Digitalis purpurea** — Foxglove · Part shade · in bloom

Lookup result fields for Digitalis purpurea:
- Common name → Foxglove
- Sun → Part shade
- Flowering → Jun – Sep
- Height → 1.2 – 2 m
- Habit → Biennial

Pause the demo loop when offscreen using `IntersectionObserver`.

---

## Scroll entrance animations

Use **Framer Motion** (`framer-motion` — install if not already present).

Every major section block fades up on first scroll into view:
- From: `opacity: 0, y: 32`
- To: `opacity: 1, y: 0`
- Transition: `duration: 0.85, ease: [0.2, 0.7, 0.2, 1]`
- Trigger: when element is ~15% into viewport
- Reveal once only (not on scroll back up)
- Hero content is above the fold — show immediately, no animation

Use `motion.div` with `whileInView` and `viewport={{ once: true, amount: 0.15 }}`.

Respect `prefers-reduced-motion` — disable animations if set.

---

## Request access form

Implement the full form UI (email field, garden textarea, submit button, privacy microcopy, and submitted confirmation state) as specified in the handover README.

On submit: prevent default, show confirmation state. **Do not wire to any endpoint yet** — leave a clearly marked TODO comment:

```ts
// TODO (Prompt 3): submit to Supabase waitlist table
```

---

## Nav and footer links

- **Login** link → `/login` (may not exist yet — that's fine, link it anyway)
- **Request access** pill in nav → smooth scroll to `#request`
- **Privacy** link in footer → `/privacy` (placeholder, fine if 404s for now)

---

## Responsive

Implement responsively as specified in the handover README:
- ≤ 860px: all multi-col grids collapse to single column
- ≤ 480px: reduced padding, smaller type, phone mockup `min(300px, 90vw)`

Use Tailwind responsive prefixes (`md:`, `sm:`) mapping approximately to these breakpoints.

---

## Out of scope

- Form submission to Supabase (Prompt 3)
- Real photography (placeholder slots only)
- Any changes to app pages (`/plants` etc.)

---

## Verification checklist

- [ ] All 8 sections render correctly at desktop width
- [ ] Responsive: collapses correctly at tablet and mobile widths
- [ ] Demo animation loops correctly through all 9 phases
- [ ] Demo pauses when scrolled offscreen
- [ ] Scroll entrance animations fire on scroll-into-view (once)
- [ ] Request access pill in nav scrolls to form
- [ ] Form shows confirmation state on submit
- [ ] Spline Sans Mono loads correctly for mono elements
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No lint errors (`npm run lint`)

**Commit message:** `feat: add Plotted marketing homepage with animated product demo`
