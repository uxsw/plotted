# Handoff: Plotted — Marketing Homepage

## Overview
This is the public marketing homepage for **Plotted**, a personal garden plant-portfolio web app. Users catalogue their plants with photos and track flowering seasons, sun needs, and growing details; an AI lookup auto-populates botanical data from a species/cultivar name. The page's job is to explain the product to UK gardeners (hobbyist → knowledgeable), highlight the AI lookup as the differentiator, and drive **Request access** sign-ups for a private beta.

Tone: polished, warm, trustworthy, botanical/organic. "Built by gardeners, for gardeners." Not generic SaaS.

## About the Design Files
The file in this bundle (`Plotted Homepage.dc.html`) is a **design reference created in HTML** — a prototype showing the intended look, copy, and behavior. It is **not production code to copy directly.** It is authored in a bespoke "Design Component" runtime (a `<x-dc>` template + a `Component` logic class) that will not exist in your codebase.

**The task is to recreate this design in Plotted's production environment** using its established framework, component library, and conventions (React/Next, Vue, Astro, etc.). Reproduce the layout, styling, copy, and interactions described below — don't try to port the `.dc.html` mechanics. If no frontend environment exists yet, pick the most appropriate framework for a marketing site (e.g. Next.js or Astro) and implement there.

To preview the reference: open `Plotted Homepage.dc.html` in a browser (it is self-contained apart from Google Fonts loaded via CDN).

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy, and interactions are intended as shown. Recreate the UI faithfully using your codebase's libraries and patterns. The only deliberately unfinished pieces are **photography**, which is represented by clearly-labelled striped placeholders with target aspect ratios — drop real images into those slots.

---

## Design Tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| Paper (primary background) | `#F4EEE1` | Page background, hero, most sections |
| Paper raised / input fill | `#FBF7EE` | Inputs, inner cards |
| Sand panel | `#EFE7D6` | Feature cards, footer background, demo card tiles |
| Sage band | `#E8E9DB` | Demo section + Request-access section backgrounds |
| Ink (primary text) | `#2C3122` | Headings, body emphasis |
| Body text | `#4A5038` | Paragraph text |
| Body text (muted) | `#5A6048` | Secondary paragraph text |
| Muted / meta | `#8A8A6E` | Captions, meta labels |
| Faint mono / numerals | `#A6926E`, `#9A9A80` | Mono numerals, footer copyright |
| Moss deep (primary button) | `#3F4A2E` | Primary CTA buttons, FAB |
| Moss (accent text) | `#5C6B45` | Eyebrow/mono accents inside app demo |
| Terracotta (accent) | `#BD6A45` | Eyebrow rules + labels, secondary CTA, "in bloom" dots, AI highlight |
| Hairline | `rgba(60,70,45,0.14)` | 1px dividers / card borders |
| Hairline (stronger) | `rgba(60,70,45,0.22)` | Input borders, image plate borders |

Image-placeholder stripe fill (replace with real photos): `repeating-linear-gradient(135deg, #E6D9BD 0 13px, #EEE3CB 13px 26px)` (darker variant uses `#DCCFB0`/`#E6DBC0`).

### Typography
- **Display / headings:** `Fraunces` (Google Fonts), **italic**, weight 400, `letter-spacing: -0.02em`. Used italic for all H1/H2/H3 and decorative captions.
- **Body / UI:** `Inter` (Google Fonts), weights 400/500/600.
- **Mono accents** (eyebrows, plate numbers, field labels, status pills): `Spline Sans Mono` (Google Fonts), 400/500, uppercase, `letter-spacing: 0.12–0.16em`.

Type scale (px) as used:
- Hero H1: 76 / line-height 1.02
- Section H2: 50–52 / 1.06–1.08
- Demo H2: 50 / 1.06
- Ethos H2: 46
- Card H3 / principle H3: 25–26
- Lead paragraph: 18–19 / 1.62–1.68
- Body: 15.5–16
- Eyebrow (mono): 12 / uppercase / tracking 0.16em
- Footer copyright (mono): 11

Google Fonts import (used in the reference):
```
https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Inter:wght@400;500;600&family=Spline+Sans+Mono:wght@400;500&display=swap
```

### Spacing / layout
- Content container: `max-width: 1120px; margin: 0 auto; padding: 0 48px;`
- Section vertical rhythm: ~104px top padding, ~96px bottom; sections separated by a 1px hairline (`border-top`) within the container, OR a full-bleed tinted band (sage) with 1px top/bottom hairlines.
- Buttons / pills: `border-radius: 999px`.
- Cards: `border-radius: 5–6px`. Inputs: `8px`. Image plates: square corners with a 9px inset double-border frame.

### Shadows
- Feature "AI" card: `0 18px 40px -22px rgba(189,106,69,0.5)` (terracotta-tinted).
- Phone frame: `0 40px 70px -28px rgba(44,49,34,0.55)`.
- Add-sheet (inside phone): `0 -16px 40px -16px rgba(44,49,34,0.28)`.

---

## Screens / Views

There is one page, composed of these stacked sections (in order). Container width and side padding are constant (see tokens).

### 1. Header / Nav
- **Layout:** Flex row, space-between, 30px vertical padding, 1px bottom hairline.
- **Left:** Wordmark "Plotted" — Fraunces 500, 25px, ink.
- **Right:** Flex row, gap 28px — a **Login** text link (Inter 14.5px, `#4A5038`) and a **Request access** pill button (Inter 14px/500, paper text on terracotta `#BD6A45`, padding 11×20, radius 999). Request access links to the form (`#request`).
- Not sticky in the reference (fine to make sticky if it fits your patterns — confirm with stakeholder).

### 2. Hero
- **Layout:** 2-col grid `1.15fr / 0.85fr`, gap 72px, ~90px top / 96px bottom padding.
- **Left (vertically centered):**
  - Eyebrow: 26px×1px terracotta rule + mono uppercase "Private beta" (terracotta).
  - H1 (Fraunces italic 76px): "Your whole / garden, quietly / in order." (3 explicit line breaks).
  - Lead paragraph (Inter 19px, `#4A5038`, max-width 470): "Plotted gives every plant you grow a place to live — photographs, flowering seasons, sun and soil. Name a species and it looks up the botanical details for you."
  - CTA row: **Request access** pill (paper on moss-deep `#3F4A2E`, padding 15×32) + microcopy (Inter 13.5px, muted): "We're inviting new gardeners a few at a time."
- **Right:** Portrait image plate, `aspect-ratio: 3/4`, 1px outer border with 9px inset frame; caption row beneath in Fraunces italic 13.5px: "Pl. 01 — The border in June" + mono "001". **Placeholder → real garden portrait (3:4).**

### 3. Product explanation
- 1px top hairline. Eyebrow (mono) "What is Plotted".
- H2 (Fraunces italic 52px, max-width 780): "A considered home for everything you grow."
- 2-col paragraph block (gap 64, max-width 880), Inter 18px:
  - Left: "Most of what we know about our own gardens lives in our heads — or scattered across plant labels, receipts and half-remembered names. Plotted brings it together into a single, beautiful catalogue of everything you grow."
  - Right: "It was built by gardeners who wanted to remember what thrived where, what flowered when, and what to plant next. Quietly clever, and never in the way of the gardening itself."
- Full-width landscape image plate `aspect-ratio: 16/6.5`, 1px border; caption "Pl. 02 — A mixed border, late summer". **Placeholder → real landscape (16:6.5).**

### 4. How it works / Key features (incl. AI highlight)
- 1px top hairline. Eyebrow "How it works".
- H2 (Fraunces italic 52px): "Name a plant. Plotted does the rest."
- Sub (Inter 18px): "Starting a record takes seconds. Keeping it takes even less."
- **3-col grid, gap 24, `align-items: stretch`:**
  - **Card 01 "Add what you grow"** — sand `#EFE7D6` background, 1px hairline, radius 6, padding 34×30. Mono "01" numeral. H3 Fraunces italic 25. Body: "Snap a photo and type the name. That's all it takes to begin a record for any plant in your garden."
  - **Card 02 "It looks up the details" — THE AI HIGHLIGHT.** Paper `#F4EEE1` background, **1.5px terracotta border `#BD6A45`**, terracotta-tinted shadow (see tokens). Top row: mono "02" + a terracotta pill "The clever bit" (mono 10px uppercase, paper on terracotta). H3 "It looks up the details". Body: "Type a species or cultivar and Plotted fills in sun, soil, flowering season and habit automatically — drawn from trusted horticultural sources." Below a **dashed terracotta divider**: mono "Digitalis purpurea" then three result chips — "Foxglove", "Part shade", "Jun – Sep" (Inter 11.5px, sand fill, hairline border, radius 999).
  - **Card 03 "Follow the seasons"** — same style as card 01. Body: "Filter by what's in bloom, what needs sun, or what to prune next — and watch your garden change through the year."

### 5. Animated product demo (phone mockup)
- **Full-bleed sage band `#E8E9DB`**, 1px top/bottom hairlines. 2-col grid `0.95fr / 1.05fr`, gap 80, vertically centered, 104px vertical padding.
- **Left — phone frame** (centered): outer bezel 330px wide, `#2C3122`, `border-radius: 46px`, padding 12, phone shadow. Inner screen: paper `#F4EEE1`, `border-radius: 35px`, **height 606px**, `overflow: hidden`, flex column. A 112×24 notch pill (`#2C3122`, radius `0 0 16 16`) centered at top.
  - **Status bar:** mono 11px — "9:41" left, "● ● ●" right.
  - **App header:** mono uppercase "My garden" + Fraunces italic 24px "Your collection"; a 34px circular avatar (striped) on the right.
  - **Filter chips row** (gap 7): "All", "In bloom", "Full sun", "Shade" — pills, Inter 12px. Active chip = filled (All active = moss-deep `#3F4A2E` fill / paper text; Full sun active during filter phase = terracotta `#BD6A45` fill). Inactive = transparent with hairline border, moss text.
  - **Plant grid:** 2-col, gap 12. Each card: sand `#EFE7D6`, hairline, radius 5, padding 7 — a `1:1` striped photo tile (with a terracotta "in bloom" dot top-right when applicable), Fraunces italic 13.5px plant name, Inter 10.5px meta. **Placeholder photo tiles → real 1:1 plant photos.**
  - **Floating + button:** 54px circle, moss-deep `#3F4A2E`, "+" glyph, shadow; bottom-right 18px. Hidden (scale + fade) while the add-sheet is open.
  - **Add sheet** (bottom overlay, height 392, paper, `border-radius: 26 26 0 0`, top hairline, upward shadow): grab handle, Fraunces italic "Add a plant", mono label "Species or cultivar", a text input showing the typed name + blinking caret, then a lookup state (loading → results).
  - Demo plant data used (name · meta · sun · in-bloom): Rosa 'Gertrude Jekyll' (Climbing rose · Full sun · bloom), Salvia nemorosa (Perennial · Full sun), Lavandula (Shrub · Full sun · bloom), Geranium 'Rozanne' (Perennial · Part shade · bloom), Alchemilla mollis (Perennial · Part shade), Hosta 'Frances' (Foliage · Shade). New plant added by the demo: **Digitalis purpurea** (Foxglove · Part shade · bloom). Lookup result fields: Common name → Foxglove, Sun → Part shade, Flowering → Jun – Sep, Height → 1.2 – 2 m, Habit → Biennial.
- **Right — copy:** eyebrow "See it in use"; H2 (Fraunces italic 50px) "Your garden, / in your pocket."; paragraph "Browse your collection at a glance, filter to what's thriving right now, and add something new in a tap — with the details filled in for you."; a live **status pill** (paper, hairline, radius 999) with a pulsing moss dot + Fraunces italic caption text that tracks the demo phase.

See **Interactions** for the demo's exact loop timing.

### 6. Ethos
- 2-col grid `0.85fr / 1.15fr`, gap 80, 104px vertical padding.
- **Left:** eyebrow "Our ethos"; H2 (Fraunces italic 46px) "Built by gardeners, for gardeners."; paragraph "Plotted is made by a small team who garden themselves. We're not chasing scale or attention — only a tool we'd want to use ourselves, for years."; a portrait image plate `aspect-ratio: 4/3`. **Placeholder → real 4:3 (hands/soil/plant).**
- **Right:** three principles, each separated by 1px hairlines (top on each; bottom on the last). H3 Fraunces italic 26 + Inter 16 body:
  - "Considered, not addictive" — "No streaks, no badges, no endless notifications. Plotted respects your attention and stays out of the way of the gardening."
  - "Your garden, yours to keep" — "Your records belong to you. Export everything whenever you like — your garden's history should never be locked away."
  - "Grown sustainably" — "A small team, a light footprint, and no pressure to grow at any cost. We'd rather build something lasting than something loud."

### 7. Request access (form)
- **Full-bleed sage band `#E8E9DB`**, 1px top hairline, `id="request"` anchor. 2-col grid `1fr/1fr`, gap 80, vertically centered, 104px vertical padding.
- **Left:** eyebrow "Private beta"; H2 (Fraunces italic 52px) "Request an invitation."; paragraph "We're welcoming new gardeners a few at a time. Leave your details and we'll be in touch when a place opens."
- **Right — form card** (paper, hairline, radius 10, padding 34):
  - **Email** field (`type=email`, required), mono uppercase label "Email address", placeholder "you@example.co.uk", fill `#FBF7EE`, hairline border, radius 8.
  - **Garden** textarea (optional), label "Tell us about your garden — optional", 3 rows, placeholder "A small town garden, mostly shade, lots of ferns and hellebores…", `resize: vertical`.
  - **Submit** button: full-width pill, paper text on moss-deep `#3F4A2E`, "Request access".
  - Privacy microcopy (Inter 12.5px, centered): "We'll only use your email to send your invitation. No newsletters, no sharing."
  - **Submitted state:** the form is replaced by a confirmation card — mono "Request received", Fraunces italic 30px "Thank you — we'll be in touch.", body "You're on the list. We send invitations in small batches, so there may be a little wait — good things, slowly grown."

### 8. Footer
- Full-bleed sand `#EFE7D6`, 1px top hairline, 48px padding. Flex row, space-between, wrap.
- Left: "Plotted" (Fraunces 500, 23) + tagline (Fraunces italic 14.5, muted) "Built by gardeners, for gardeners."
- Middle: links (Inter 14, `#5A6048`) — **Login**, **Privacy**.
- Right: mono 11px "© 2026 Plotted · Made in the United Kingdom".

---

## Interactions & Behavior

### Scroll entrance animations
Every major block fades up on first scroll into view: from `opacity:0; translateY(32px)` to `opacity:1; translateY(0)`, transition `opacity/transform .85s cubic-bezier(.2,.7,.2,1)`. Trigger when the element is ~15% into the viewport (IntersectionObserver, `rootMargin: 0px 0px -10% 0px`, `threshold: 0.15`). Above-the-fold content (hero) is shown immediately without animation. Reveal each element once. The brief originally specified **Framer Motion** for these — in a React codebase, implement with Framer Motion `whileInView` / `useInView` (or `motion` variants); the reference used a hand-rolled IntersectionObserver only because the prototype runtime couldn't bundle Framer Motion.

### Product demo loop (pure CSS/JS, non-interactive, infinite)
A state machine drives the phone. One full cycle, in order (approx durations):
1. **Grid** (2.6s) — all plants shown, "All" chip active. Caption: "Browsing the collection".
2. **Filter by sun** (2.5s) — "Full sun" chip activates (terracotta); non-full-sun cards fade to `opacity: 0.14; transform: scale(0.95)` (transition `all .55s`). Caption: "Filtering by sun".
3. **Clear filter** (1.1s) — back to all. Caption: "Browsing the collection".
4. **Open add sheet** (0.9s) — FAB hides; sheet slides up `translateY(115%) → 0` (transition `transform .55s cubic-bezier(.2,.8,.2,1)`). Caption: "Adding a new plant".
5. **Type species** — "Digitalis purpurea" typed character-by-character (~80ms/char) into the input, blinking caret.
6. **Lookup loading** (1.3s) — three pulsing terracotta dots + "Looking up the details…". Caption: "Looking up the details".
7. **Lookup done** (2.6s) — results card appears: a moss dot + "Found automatically" label, a bordered field table (Common name/Sun/Flowering/Height/Habit), and an "Add to garden" moss-deep button.
8. **Saved** (2.9s) — sheet slides down; a **Digitalis purpurea** card animates into the top of the grid with a terracotta highlight ring (`box-shadow: 0 0 0 3px rgba(189,106,69,0.18)`, 1px terracotta border). Caption: "Saved to your garden".
9. Loop back to step 1 (reset state).

The right-hand status pill caption is bound to the current phase. Keep the loop CPU-light and pause when offscreen if convenient.

Continuous micro-animations: input caret blink (1s steps), loading-dot pulse, status-pill dot pulse.

### Form
- Controlled email + textarea. Email required (`type=email` validation). On submit: `preventDefault`, swap to the confirmation state. **Wire submit to your real waitlist/CRM endpoint** (the reference just toggles local state).

### Hover/focus states
The reference doesn't define explicit hover states — apply your design system's standard button/link hover and input focus treatments (suggested: subtle darken on the moss/terracotta pills; a terracotta or moss focus ring on inputs).

### Responsive
The reference **is responsive**, with two breakpoints implemented via media queries (in a real codebase, express these with your framework's standard responsive utilities):
- **≤ 860px (tablet/large phone):** every 2-col and 3-col grid collapses to a single column (hero, product paragraphs, feature cards, demo, ethos, form); the phone demo sits above its copy. Container side padding 48 → 24px. Section vertical padding ~104 → ~64px. Display type scales down fluidly: H1 `clamp(42px, 11vw, 64px)`, H2 `clamp(32px, 7.6vw, 48px)`.
- **≤ 480px (phone):** container side padding → 18px; phone mockup width `min(300px, 90vw)`; H1 `clamp(34px, 9.6vw, 46px)`, H2 `clamp(29px, 8.4vw, 40px)`.
- The hero CTA row (button + microcopy) is `flex-wrap: wrap` so it stacks cleanly when it can't fit one line. The footer wraps. Image plates keep their aspect ratios at any width. There are no fixed-width elements other than the phone mockup (which is viewport-capped).

Behaviorally: all the above is what to reproduce, but use your own grid/breakpoint system rather than copying the exact `@media`/`clamp()` values if your design system prescribes different breakpoints.

---

## State Management
- **Demo:** phase index + flags (`filter`, `sheet`, typed string, `looked` = none/loading/done, `added`) on a timer loop; derived view = visible/dimmed cards, chip active styles, caption. No data fetching — all demo content is static.
- **Form:** `email`, `garden`, `submitted` booleans/strings. On submit → `submitted = true`. Replace with a real async submit (loading + error states) when wiring the endpoint.
- **Reveal:** per-element "has entered viewport" (one-shot).

## Assets
- **Fonts:** Fraunces, Inter, Spline Sans Mono (Google Fonts — self-host in prod if preferred for performance/privacy).
- **Photography:** none included — every image is a labelled striped placeholder. Needed (warm, natural-light garden/plant photography): hero portrait **3:4**; product landscape **16:6.5**; ethos portrait **4:3**; in-app plant tiles **1:1** (several). No icons or logos beyond the text wordmark.
- **No SVG illustration** is used; the botanical character comes from type, color, mono accents, plate numbers, and thin rules.

## Files
- `Plotted Homepage.dc.html` — the full design reference (all sections, the demo state machine, and the scroll-reveal logic). Open in a browser to view; read the source to see exact inline styles and copy.
