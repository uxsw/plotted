---
name: Plotted
description: A knowingly AI-assisted seasonal companion for a gardener's own garden — the rigour of a nursery plant catalogue, brightened.
colors:
  paper: "#FAF6EC"
  paper-deep: "#F2ECDB"
  paper-line: "#E3D8BC"
  sand: "#E8DFC8"
  sand-line: "#D9CCAC"
  ink: "#2B2A24"
  ink-soft: "#5B574A"
  white: "#FFFFFF"
  marigold: "oklch(65.809% 0.15943 31.855)"
  vermillion: "oklch(80.309% 0.11551 37.858)"
  highlight-yellow: "oklch(94.577% 0.10215 110.6)"
  gold: "oklch(89.589% 0.11806 89.132)"
  mimosa-yellow: "oklch(84.25% 0.06996 103.26)"
  lavender: "oklch(52.839% 0.09034 282.87)"
  lavender-white: "oklch(98.0% 0.09034 282.87)"
  cyan: "oklch(78.91% 0.07815 206.15)"
  cyan-deep: "oklch(58% 0.095 206.15)"
  red: "oklch(70.172% 0.11901 7.0907)"
  smoke-red: "oklch(83.547% 0.04691 4.6691)"
  off-white-warm: "oklch(98.0% 0.01 29.5)"
  n-cool-grey: "oklch(86.236% 0.0068 106.54)"
  n-grey: "oklch(82.105% 0.01173 176.24)"
  n-dark-grey: "oklch(60.535% 0.01045 100.09)"
  n-deep-grey: "oklch(29.716% 0 0)"
typography:
  display:
    fontFamily: "Fraunces, 'Fraunces Fallback', Georgia, serif"
    fontSize: "clamp(2.244rem, 1.767vw + 1.930rem, 3.815rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontStyle: "italic"
  headline:
    fontFamily: "Fraunces, 'Fraunces Fallback', Georgia, serif"
    fontSize: "clamp(1.627rem, 0.915vw + 1.465rem, 2.441rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontStyle: "normal"
  title:
    fontFamily: "Fraunces, 'Fraunces Fallback', Georgia, serif"
    fontSize: "clamp(1.202rem, 0.406vw + 1.130rem, 1.563rem)"
    fontWeight: 600
    lineHeight: 1.15
    fontStyle: "normal"
  body:
    fontFamily: "Inter, 'Inter Fallback', system-ui, sans-serif"
    fontSize: "clamp(0.909rem, 0.102vw + 0.891rem, 1.000rem)"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "'Spline Sans Mono', ui-monospace, monospace"
    fontSize: "clamp(0.728rem, 0.082vw + 0.713rem, 0.800rem)"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.14em"
rounded:
  s: "2px"
  m: "4px"
  l: "8px"
  pill: "32px"
  roundel: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.marigold}"
    textColor: "{colors.off-white-warm}"
    rounded: "{rounded.s}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.vermillion}"
    textColor: "{colors.n-deep-grey}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.n-deep-grey}"
    rounded: "{rounded.s}"
    padding: "12px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.highlight-yellow}"
    textColor: "{colors.n-deep-grey}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.n-deep-grey}"
    rounded: "{rounded.s}"
    padding: "12px 16px"
  button-ghost-hover:
    backgroundColor: "{colors.highlight-yellow}"
    textColor: "{colors.n-deep-grey}"
  button-danger:
    backgroundColor: "{colors.n-deep-grey}"
    textColor: "{colors.white}"
    rounded: "{rounded.s}"
    padding: "12px 16px"
  button-scheme:
    backgroundColor: "{colors.lavender}"
    textColor: "{colors.lavender-white}"
    rounded: "{rounded.s}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.m}"
    padding: "{spacing.md}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.m}"
    padding: "8px 12px"
  badge:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "0 4px 0 8px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.n-deep-grey}"
    padding: "8px 0 0"
  nav-item-active:
    textColor: "{colors.marigold}"
---

# Design System: Plotted

## Overview

**Creative North Star: "The Living Catalogue"**

Plotted takes the rigour of a printed nursery plant catalogue — plate numbers, italic botanical Latin, hairline rules, warm paper stock, a faint printed grain — and pulls it forward into something brighter and unmistakably software. It is a knowingly AI-assisted gardening companion, so the surface is allowed to feel technical and tactile at the same time: real texture and warmth, but crisp edges and no nostalgic cosplay. The Nursery Catalogue is a reference for *precision and calm*, not for period styling.

Colour is drawn from the garden itself and used through the interface to echo that richness — sun needs, flowering seasons, plant traits all carry their own hue — but it is held in restraint so it never competes with the gardener's own plant photographs, which are always the brightest thing on the page. Chrome stays quiet; content brings the colour. The single brand accent, a warm marigold, is spent sparingly on primary action and active navigation.

The atmosphere to protect is **alive, bright, warm, friendly, supportive; simple, informative, and never chaotic or clinical**. Depth is achieved with tonal paper layers and 1px hairlines rather than shadow — surfaces are flat at rest, and a shadow only ever appears as a response to interaction.

**Key Characteristics:**
- Warm paper ground (`#FAF6EC`) with a faint multiply-blended noise grain — never flat white; white is reserved for raised cards.
- Fraunces for every display and heading level — bold roman (600) in the product UI, italic 400 on marketing/editorial surfaces; Inter for UI text; Spline Sans Mono for labels, plate numbers and botanical metadata.
- Structure carried by 1px hairline borders and paper/sand tonal layering; flat by default.
- One brand accent (marigold) used on ≤10% of a screen; a broad `--sem-*` semantic-colour system carries all trait, sun, season and status colour.
- Print-catalogue devices retained: specimen/plate numbers, italic Latin, caption lines, framed image "plates".
- Two type-adjacent registers: a wide editorial marketing surface (~1120px) and a narrow product measure (~800px).

## Colors

A warm, low-glare neutral base — bone and sand paper tones under near-black text — lit by one marigold accent and a wide family of soft semantic hues that colour-code plant information. The neutral tokens are authored as hex; every accent and grey is authored in OKLCH. `styles/abstracts/_variables.scss` is the single source of truth (confirmed 2026-08-22); the warmer moss/terracotta/sage palette still visible on the marketing route (`app/(marketing)/_components/tokens.ts`) is a **legacy fork being folded in**, not a sanctioned second palette.

### Primary
- **Marigold** (`oklch(65.809% 0.15943 31.855)` ≈ `#E26650`): the sole brand accent. Primary buttons, active nav underline and label, key affordances, error-field borders in forms. It replaced the retired `moss`, `clay` and `gold` tokens — flat only, no tint or opacity variants.
- **Vermillion** (`oklch(80.309% 0.11551 37.858)`): the hover partner for marigold and lavender action buttons — the fill lightens to vermillion and the text flips to near-black.

### Secondary
- **Highlight Yellow** (`oklch(94.577% 0.10215 110.6)`): the shared reactive highlight — hover/active fill on ghost and secondary buttons, popover items, autocomplete rows, chips, text-button hover, and the `is-info` surface. Also the resting background of a card's media well before the image loads.
- **Gold** (`oklch(89.589% 0.11806 89.132)`) / **Mimosa Yellow** (`oklch(84.25% 0.06996 103.26)`): deeper chip-hover and skeleton-shimmer tints in the same hue family.

### Tertiary
- **Lavender** (`oklch(52.839% 0.09034 282.87)`) with **Lavender White** (`oklch(98.0% 0.09034 282.87)`): the Planting Schemes accent — the `button-scheme` variant and the `is-wildlife-friendly` badge family relate to it.
- **Cyan** — two registers of one hue (206.15), and the split is load-bearing. **Cyan Deep** (`oklch(58% 0.095 206.15)` ≈ `#158A96`) is the *indicator*: read only through `--sem-focus-color`, it carries every `:focus-visible` ring and every "this field has the caret" edge. **Cyan** (`oklch(78.91% 0.07815 206.15)`) is the *surface*: it survives only where it sits **behind dark text**, such as the selected plant card's caption pill (`n-deep-grey` on light cyan = 5.0:1, where the deep value would give 2.8:1). Everything else that was on it is a *line, a mark or an icon* — the checked-toggle track, selected-card boundaries, the check badge, the identify radio mark — so it takes the deep value. Light cyan is only ~1.7:1 against paper, so it cannot legally carry an indicator; the deep value clears 3:1 against every ground in the system (paper 3.7 · white 4.1 · highlight-yellow 3.6 · oat 3.5 · hay 3.2). Neither is a decorative colour.
- **Red** (`oklch(70.172% 0.11901 7.0907)`) / **Smoke Red** (`oklch(83.547% 0.04691 4.6691)`): placeholder-icon colour inside empty card media, and the soft hover wash on destructive popover items. Hard error colour is a separate fresh `#AD0018` in the semantic layer, not this token.

### Neutral
- **Paper** (`#FAF6EC`): the page ground everywhere, always carrying its SVG noise grain at ~8% alpha, `multiply` blended.
- **Paper Deep** (`#F2ECDB`) / **Paper Line** (`#E3D8BC`): the next tonal step down for insets and section fills, and the default hairline border colour (`--sem-border-color` → paper-line).
- **Sand** (`#E8DFC8`) / **Sand Line** (`#D9CCAC`): warmer panel fill and a slightly stronger divider, e.g. card footers (mixed to 60% over transparent).
- **White** (`#FFFFFF`): raised surfaces only — cards, dialogs, popovers, autocomplete menus. Never a page background.
- **Ink** (`#2B2A24`) / **Ink Soft** (`#5B574A`): headings and labels; `ink-soft` for secondary/label text.
- **N Deep Grey** (`oklch(29.716% 0 0)`): body copy and running text (`<body>` colour), plus the `button-danger` fill. **This is the text default, not `ink`.**
- **N Dark Grey / N Grey / N Cool Grey** (`oklch(60.5% … / 82.1% … / 86.2% …`): structural greys — text-button rest colour, disabled states, `is-active` menu fill, chrome.

### Named Rules
**The One Accent Rule.** Marigold is the only brand accent in product chrome and appears on ≤10% of any screen — primary action and active nav. Anywhere the interface is more colourful than that, the colour is coming from plant *content* (photos, traits, seasons) via the semantic layer, not from chrome.

**The Semantic Layer Rule.** Trait, sun, season and status colours are declared as `--sem-*` tokens that reference the palette (or a purpose-made hex where the review demanded one). Components read `--sem-*` through object-private `--_*` custom properties — never raw `--color-*` — for any stateful colour. New state colours go through this layer.

**The Focus Colour Rule.** Every focus ring and every active-field edge in the app reads `--sem-focus-color` — never `--color-b-cyan`, never a per-component value. It resolves to Cyan Deep because a focus indicator is a non-text UI component under WCAG 1.4.11 and must clear 3:1 against whatever it sits on; the app's grounds run from paper to highlight-yellow, so the token is chosen against the lightest of them. A new interactive object gets its focus state from this token, and if the indicator ever needs to change, it changes here once.

**The Highlight-Yellow convention** *(established pattern, not an invariant).* `highlight-yellow` is the one reactive colour that marks whatever the pointer is on. Keep every new interactive object consistent with it on hover/active. It marks the pointer and **nothing else** — see the next rule.

**The Chosen-Is-Filled Rule.** In a choose-one group, hover and selected must never share a treatment. Hover takes the highlight-yellow tint; *chosen* takes a **fill** in the context's accent (lavender in Planting Schemes) with its paired light text. The failure this prevents is specific and was live in `.c-scheme-prefs__choice`: hover and `.is-selected` shared one declaration block, so moving the pointer across the group made every option you touched look like the one you had picked. A fill also survives sitting next to a hovered sibling, which a border-colour swap does not. Where the option is a **photo card**, a fill would bury the photograph, so the job passes to a real radio mark that is drawn in *both* states (see Radio card) and hover falls back to the card lift. Selection must additionally be exposed to assistive tech — `aria-pressed` on a button group, or real radio semantics.

**The Semantic Field exception** *(scoped to the `/plant-scheme` journey).* The flowering-season hues normally appear only in small badges and roundels — "held in restraint" per the Overview. The planting-scheme flow is the one sanctioned place a `--sem-flowering-*` pair carries **large surfaces and a whole path's accent**:

- On the schemes hub (`/plant-scheme`), the start panel (`.c-scheme-start`) wears `--sem-flowering-spring-*` — a border just beginning — on its head band and the tray pills' wash; each Carry on draft (`.c-scheme-draft`) wears `--sem-flowering-summer-*` — a border growing — on its sketch well and elevation strokes; the annotated example keeps early summer, a season neither uses.
- The conversation then **carries a season forward** as its accent (`is-path-existing` when any garden plant was chosen, `is-path-scratch` otherwise): the step marker's track, the scheme-list letterhead, the elevation strokes. Routed through `--_accent` / `--_accent-wash` private props.

Colour still goes through object-private `--_*` props per the Semantic Layer Rule. This is the scheme journey's licence, not a template — an ordinary Operate screen wanting a coloured field is drift.

## Typography

**Display Font:** Fraunces (with `'Fraunces Fallback'`, Georgia, serif) — loaded weights 400/500/600, normal + italic.
**Body Font:** Inter (with `'Inter Fallback'`, system-ui) — weights 400/500/600.
**Label / Mono Font:** Spline Sans Mono (with `ui-monospace`) — weights 400/500.

**Weight axis** (`styles/abstracts/_variables.scss`): `--font-weight-regular: 400` (body) · `--font-weight-medium: 500` → `.o-type-weight--medium` (mono labels, subtle UI emphasis) · `--font-weight-bold: 600` → `.kirk` (the product-heading voice). No 700 anywhere.

**Character:** A high-contrast pairing that reads two ways by surface. In the **product UI** Fraunces is set *bold roman* (`.kirk` / weight 600) — headings are firm, confident, quietly authoritative, the voice of a well-made reference tool. On **marketing and editorial surfaces** the same face turns *italic at weight 400* — the cadence of an engraved catalogue caption, warm and a little literary. Inter keeps the working text plain, neutral and quiet; Spline Sans Mono adds a technical, plate-number register that signals the AI/tech side of the product without shouting. Sizes follow a closed printers'-names scale (`minion → brevier → primer → pica → paragon → canon`, with `long-` variants) defined as fluid `clamp()` steps in `styles/base/_typography.scss`; `.canon` / `.paragon` / `.long-paragon` carry `font-weight: 600` built in, the smaller steps inherit 400.

### Hierarchy
- **Display** (Fraunces, `clamp(2.24rem → 3.82rem)` [`.canon`], line-height 1, letter-spacing `-0.02em`): the big statement headline. *Italic 400* on the marketing hero — its single most brand-defining type moment. In-app, the equivalent large heading is set roman 600 like every other product heading.
- **Headline** (Fraunces roman 600 [`.kirk`], `clamp(1.63rem → 2.44rem)` [`.paragon`], line-height 1): app page titles (`<h1>` on `/plants`, `/schemes`, `/shopping-list`, auth), section headers, empty-state headings, dialog titles. This is the workhorse app heading. Marketing section headings instead take italic 400.
- **Title** (Fraunces roman 600 [`.kirk`], `clamp(1.20rem → 1.56rem)` [`.pica` / `.long-primer`], line-height ~1.15): card titles and sub-section headers. Botanical Latin inside a title is additionally italicised (`.o-type--italic`), so a plant card reads as bold-roman with an italic species — see the Latin-in-Italic Rule.
- **Editorial display-body** (Fraunces roman 400, no `.kirk`, `.long-primer`/`.primer` size): long narrative-intro paragraphs rendered in the display face rather than Inter — e.g. a scheme's `narrative_intro`. Not a heading; the absence of `.kirk` is what separates it.
- **Body** (Inter 400, `clamp(0.91rem → 1.00rem)` [`.primer`], line-height 1.5): all running text. Running prose is capped near 65ch via `.o-measure` (`max-width: var(--measure)`, 34rem) so it stays readable in the wide dashboard and marketing containers. Marketing lead paragraphs step up to ~18–19px at a ~470–520px measure.
- **Body-sm** (Inter 400, `clamp(0.81rem → 0.89rem)` [`.brevier`], line-height 1.5): secondary text, card subtitles, helper and hint copy.
- **Caption / data** (Inter, `clamp(0.73rem → 0.80rem)` [`.minion`]): metadata, timestamps, badge text, and — with `.o-type-tabular` — dense numeral columns (weather strips).
- **Label** (`.o-type-label` — Spline Sans Mono 500, `.minion` size, letter-spacing `0.14em`, uppercase): eyebrows, plate numbers, **all field labels**, status pills, botanical metadata. This is now the single label treatment — the earlier Inter small-caps variant on form fields is retired.

### Named Rules
**The Two-Register Rule.** Fraunces *headings* are **bold roman (600)** in the product UI and **italic (400)** on marketing/editorial surfaces — never mixed within one surface. An app section header in italic, or a marketing headline in bold roman, is drift. Weight and style are chosen by surface mode (Operate → roman 600; Persuade/Read editorial → italic 400), not by taste per screen.

The rule governs headings, not the italic voice entirely. In-app, Fraunces **italic 400 is allowed for a short editorial aside** — a *non-heading* line that speaks in Plotted's voice or looks ahead, set apart from the working copy (e.g. the "what's next" note on a journey step). It joins the existing in-app non-heading Fraunces use (the roman-400 "editorial display-body"). One aside per view; never a run of body copy, never a heading.

**The Mono Label Rule.** Eyebrows, specimen/plate numbers, field labels and botanical metadata all use `.o-type-label` — Spline Sans Mono, uppercase, `letter-spacing: 0.14em`, weight 500, `.minion` size. One class, no per-context variants; it is the type element that carries the "tech-aware" half of the identity.

**The One Scale Rule.** Type size comes only from the printers'-names step classes (`minion → canon` + `long-` variants) in `styles/base/_typography.scss`, and line-height only from `.o-type-leading--*`. Tailwind `text-*` / `font-*` / `leading-*` and arbitrary `text-[Npx]` are not part of this system — they are being converted out. Never introduce a new size value; map the need onto the nearest step.

**The Latin-in-Italic Rule.** Botanical names (genus, species, cultivar) are always rendered italic, whatever the surrounding type.

## Layout

Five containers, chosen by surface intent:

- **Product measure** — `.o-page`: `max-width: 800px`, centred, `padding: var(--space-md)` (16px). The default for every authenticated app page — a narrow, readable, single-task column.
- **Companion measure** — the dashboard (`/dashboard`) only: a single vertical stream at `max-width: ~1000px`, still centred, still one column. The dashboard is a check-in surface that stacks four peer content blocks (recent plants, weather, garden visitors, shopping list); it earns the extra width so cards and horizontal scrollers can breathe and, on desktop, resolve into inline rows rather than scroll. It does **not** become multi-column. No other app route uses this measure.
- **Hub measure** — the planting schemes hub (`/plant-scheme`) only: `.o-page:has(.c-scheme-hub)` widens to `max-width: 90rem`. Below `60rem` one column — title, Carry on drafts, start panel, finished plans (drafts first, so a returning gardener reaches them before the panel). From `60rem`, two columns: a `minmax(22rem, 27rem)` start panel, sticky and capped at the viewport height with its garden grid scrolling inside, beside a fluid column holding drafts then plans. It is a workbench — starting and browsing share one surface — so it earns a second column; it never becomes three.
- **Full-width workspace** — the `/plant-scheme/chat` destination (`phase: "scheme"`) only: `.o-page:has(.c-scheme-workspace)` drops `max-width` entirely, so the workspace fills the viewport with only the `.o-page` `--space-md` gutter kept. Above `52rem` the two panes are `grid-template-columns: minmax(0, 1fr) auto` — **the conversation takes all the room going**, and the scheme-list sheet holds to a bounded catalogue-page width (`clamp(20rem, 34vw, 32rem)`) so it never scales up with the monitor. It is additionally a **fixed-height app shell**: `.min-h-screen:has(.c-scheme-workspace)` becomes a `100dvh` flex column, so the composer pins to the base of the viewport, the chat log flexes to fill the gap under the nav, and each pane scrolls internally — the page itself does not scroll (the shared app footer is not surfaced here). Below `52rem` the panes stack and the page scrolls normally. The question-flow phase (`phase: "questions"`) of the same route stays at the product measure.
- **Editorial measure** — marketing `WRAP`: `max-width: 1120px`, `padding: 48px` stepping to `24px` at ≤860px and `18px` at ≤480px. Wider, plate-and-column compositions.

**Grid & rhythm.** Card collections use `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` with `gap: var(--space-md)` (both `.o-card-grid` and `.c-plant-grid`). Vertical rhythm is the `.o-stack` object: `display: grid` with `gap` of `--space-sm` / `--space-md` / `--space-xl` (compact / default / spacious). Horizontal groupings use `.o-row` (flex, `align-items: center`, `gap: --space-sm`) with `--space-between` and `--align-top` modifiers.

**Spacing scale.** `--space-base: 1rem`; steps `xs 4px · sm 8px · md 16px · lg 24px · xl 32px` (0.25× / 0.5× / 1× / 1.5× / 2×). Use scale tokens, not raw values — Stylelint validates custom-property names against the known token list.

**Breakpoints.** `--breakpoint-tablet: 860px`, `--breakpoint-mobile: 480px` (consumed as Tailwind `max-tablet` / `max-mobile`). These are the project's own; a stray `sm:` (640px) in `Input.tsx` is off-system.

**Responsive behaviour.** Marketing multi-column grids collapse to a single column at `max-tablet`; hero/ethos two-up layouts stack; display type drops to `clamp()` ladders (`~76px → clamp(34px, 9.6vw, 46px)` at mobile). The product measure is already narrow, so app pages mostly reflow rather than restructure. The dashboard is the one app surface that meaningfully restructures across width: its per-block horizontal card scrollers stay scrollers on mobile and become inline card rows (3–4 shown, overflow behind "View all") once the companion measure has room.

### Named Rules
**The Narrow Column Rule.** App pages hold to the ~800px `.o-page` measure — one readable column, one task. The 1120px editorial container is a marketing device and never appears in the app. The **sanctioned width exception** is the dashboard, which runs the ~1000px companion measure (still one centred column, never multi-column) because it is a stack of peer check-in blocks rather than a single task. The planting scheme journey holds the other two: the `/plant-scheme` hub's bounded two-column workbench and the chat workspace (below). A new app route wanting extra width is drift, not a precedent.


A third — and the one place the app goes full-bleed for *width*, not immersion: the `/plant-scheme/chat` **workspace** (`.c-scheme-workspace`, `phase: "scheme"`) drops the `.o-page` measure altogether and fills the viewport, keeping only the `--space-md` gutter. Two peer panes, but not symmetrically: the conversation takes all the room going while the scheme-list sheet is itself capped (`clamp(20rem, 34vw, 32rem)`), so only the conversation grows with the display. Above `52rem` it also runs as a `100dvh` fixed-height shell — composer pinned to the viewport base, log flexing to fill, each pane scrolling on its own, the page not scrolling (no app footer) — a height chain that passes down from `.min-h-screen` with no measured offsets. It never becomes a third column, and the question-flow phase of the same route keeps the 800px measure. This is the sole full-width app surface; a new route wanting either the width or the fixed-height shell is drift.

## Elevation & Depth

The system is **flat by default**. At rest, surfaces are separated by tonal paper layers (`paper` → `paper-deep` → `sand` → `white`) and 1px hairlines — not shadow. The paper grain adds a tactile, printed quality that reads as depth without any cast shadow. Shadow is strictly a *state response*: card hover, open dialog, open popover, image overlay.

### Shadow Vocabulary
- **Menu / raised-panel** (`box-shadow: 0 4px 6px -1px #0000001a, 0 2px 4px -2px #0000001a`): popovers and the autocomplete menu. The one consolidated "low" step.
- **Card hover / frame** (`box-shadow: 0 8px 24px rgba(0,0,0,0.15)`): the lift on `.o-card--interactive:hover` (also raises `z-index` to 1) and on scheme "frame" panels. The de-facto "raised" step.
- **Dialog** (`box-shadow: 0 20px 25px -5px #0000001a, 0 8px 10px -6px #0000001a`): modal dialogs only — the deepest step, reserved for content that stops the page.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. A shadow appears only as a reaction to state — hover, open, overlay — and never as ambient decoration. If a resting element needs to stand out, reach for a tonal layer or a hairline first.

**The Grain Rule.** The page ground always carries its `feTurbulence` noise texture at ~8% alpha, `multiply` blended. A pure flat `#FFF` or un-grained `#FAF6EC` fill at page level is a regression.

## Motion

Two easing curves, from `styles/abstracts/_variables.scss`:

- **`--transition-easing-default`** (`ease`), at `--transition-time-default: 0.4s` (also `-slow: 0.8s`, `-x-slow: 1s`): incidental transitions — a hover fill, a border colour, a focus ring settling. Cheap, unremarkable, everywhere.
- **`--transition-easing-emphasis`** (`cubic-bezier(0.16, 1, 0.3, 1)` — exponential ease-out, "settling toward the light"): the **one authored moment** on a surface. The annotated example's border planting itself when first scrolled into view; a starting plant settling into the schemes hub's tray. Reserve it for that single deliberate motion — a page where every transition uses the emphasis curve has no authored moment, just noise.

Named keyframes: **`chat-typing`** (`_chat.scss`) — three dots pulsing opacity + a `0.125rem` rise, `1.2s` staggered `0.15s`, `infinite`; the chat surface's authored moment while the assistant composes. Static (`opacity: 0.55`) under reduced motion.

**"The planting"** (`_scheme-chat.scss`) — the scheme workspace's authored moment: one orchestrated response to a plant joining the scheme, on the emphasis curve. `scheme-item-in` (fade + `-0.25rem` settle) eases the list card and the chat suggestion card in, `scheme-card-wash` flashes the card from `--_accent-wash` to white, and `scheme-elevation-draw`/`-dot` draw the plant's silhouette up from the ground line (strokes are `pathLength`-normalised so one dash pair animates any shape; flower-head dots bud a beat after their stem). All share a per-item `--_delay`, `0` for a single add and staggered (~70–90ms per item) when a populated sheet or a fresh suggestion panel first arrives — a scheme lands as a planting, not a dump. Every keyframe is `animation: none` under reduced motion.

### Named Rules
**The One Authored Moment Rule.** A surface gets one motion that is designed — orchestrated, on the emphasis curve, from an already-visible resting state. Everything else is incidental (default curve) or still. Every keyframe and transition honours `prefers-reduced-motion: reduce` — the authored moment degrades to an instant state change, never a jump.

## Shapes

Restrained, mostly-square corner language. Chrome (buttons, inputs, cards, dialogs, popovers, menus) uses the tight radius steps — `s 2px`, `m 4px`, `l 8px` — with `2px` on buttons and `4px` on cards and inputs being the common cases. Fully round forms are reserved for two jobs: `pill 32px` for **badges and chips** (static labels and interactive tags), and `roundel 50%` for **avatars, icon-only actions and sun roundels**.

**Chat bubbles** stay inside the scale: `l 8px` all round, with the **one corner nearest the speaker squared to `s 2px`** (assistant → bottom-left, user → bottom-right). It's the familiar chat tell, done with the existing steps rather than a new rounded value or a tail.

Borders are a first-class structural tool: `--border-width-hairline: 1px` for all resting structure, `--border-width-thin: 2px` for active/focus emphasis (active underline field, focus outline, AI-highlight card border).

**Signature silhouette — the image plate.** Photographs on editorial surfaces sit inside a `9px` solid `paper` mat within a `1px rgba(60,70,45,0.3)` frame, captioned below in Fraunces italic with a mono specimen number to the right (`Pl. 01 — …` / `001`). In-app image displays round only their bottom corners (`border-radius: 0 0 8px 8px`) so they sit flush under a header. The caption always sits **below** the photograph, never over it — essential copy on a scrim was tried on the `/plant-scheme` entry and retired: text over an image is hard to read outdoors and makes the photograph carry information it shouldn't.

## Components

### Buttons
- **Shape:** near-square (`border-radius: var(--radius-s)`, 2px). Padding `0.75rem 1rem`, Inter `0.875rem`, `line-height: 1`, `inline-size: max-content`.
- **Primary:** marigold fill, warm off-white text (`--color-r-white`). Hover → vermillion fill, near-black text. The default; one per view.
- **Secondary:** transparent, near-black text, `1px` near-black border. Hover → highlight-yellow fill and border.
- **Ghost:** transparent, near-black text, no border. Hover → highlight-yellow fill. For low-stakes inline actions.
- **Danger:** near-black (`n-deep-grey`) fill, white text; hover lightens to dark-grey. Focus → 2px marigold outline, 2px offset.
- **Ghost-danger:** neutral (`ink-soft`) until hover/focus, then marigold. For destructive actions that shouldn't shout at rest.
- **Scheme:** lavender fill, lavender-white text — the Planting Schemes context only. Hover → vermillion.
- **Focus (all):** `box-shadow: 0 0 0 2px var(--color-paper), 0 0 0 4px var(--color-p-lavender)` — a lavender ring floated off the paper. (Note: some objects instead use a 2px `--sem-focus-color` `outline` — the ring is the button-component convention, the deep-cyan outline is the field/menu convention.)
- **Shape modifiers:** `--w100` (full width), `--pill` (fully round), `--icon` / `--avatar` (40×40 square / circle, no padding), `--flush-start` (zero leading padding that grows to `0.5rem` on hover — a catalogue-margin gesture).
- **Spotting toggle** (`--not-spotted` / `--is-spotted`): pill, `1px` marigold border; unspotted is translucent white with `backdrop-filter: blur(20px)`, spotted is solid marigold with white text. The garden-wildlife signature control.

### Chips
- **Style:** pill (`--radius-pill`), `inline-flex`, `line-height: 2`, `font-size: 0.85rem`, asymmetric padding (`8px` start / `4px` end to seat a trailing action). Transparent by default; `.is-info` → highlight-yellow. Hover → gold.
- **Action element** (`.o-chip__action`): a `24×24` circular hit area for the trailing control (usually remove), hover → white.
- **Use:** chips are interactive (filter, dismissible tag). For a static label, use a badge instead.

### Badges & Roundels
- **`.o-badge`** — static labels only. Pill, `1px` border, `0.85rem` (or `0.65rem` at `.is-sm`), colour driven entirely by `--_badge-*` private properties set per modifier. Default is paper fill / ink-soft text / paper-line border.
- **The trait system:** `.is-edible`, `.is-drought-tolerant`, `.is-british-native`, `.is-wildlife-friendly`, `.is-full-sun` / `.is-partial-shade` / `.is-full-shade`, `.is-flowering-winter … -autumn`, `.is-bug` / `.is-error` / `.is-feedback` / `.is-info` — each maps to a `--sem-*-bg` / `--sem-*-fg` pair. This family is where the "colour of a garden" lives: soft, distinct, legible, AA-checked.
- **`.o-roundel`** — icon-only, `1.5rem` circle, same `--sem-*` colour families as the sun badges. Use `.o-badge` for text, `.o-roundel` for icon-only.

### Toggle (`.o-toggle`)
A `44×24` pill switch with a `16px` knob, `role="switch"` + `aria-checked`. **Off** is an outlined track: transparent fill, `1px` `n-dark-grey` border, `n-dark-grey` knob. **On** is a filled track: `--color-b-cyan-deep`, matching border, `white` knob. The two states differ by fill *and* knob position, never colour alone, and the knob sits at a symmetric `5px` inset at both ends. The earlier pairing (grey track / light-cyan track, white knob on both) put the knob at 1.9:1 against the "on" fill — the one part that reports the state was the least visible thing in the control. Deep cyan is referenced through the palette token, not `--sem-focus-color`, so the focus token stays single-purpose.

### Cards
- **Corner style:** `4px` (`--radius-m`), `overflow: hidden`.
- **Background:** white (raised). `--flat` variant is transparent, borderless.
- **Shadow strategy:** none at rest; `0 8px 24px rgba(0,0,0,0.15)` + `z-index: 1` on `--interactive:hover`; `scale(0.98)` + `opacity: 0.75` on `:active`.
- **Border:** none — the white fill against grained paper is the edge.
- **Structure:** `__media` (4:3, highlight-yellow well before load, badges pinned top-right), `__body` (`padding: var(--space-md)`, `gap: 0.375rem`, bold-roman Fraunces title with the botanical binomial italicised), `__footer` (sand-line top border at 60%).
- **Internal padding:** `--space-md` (16px) body; `0 16px 16px` footer.

### Photo dropzone (`.c-add-photo`)
The add-a-plant photo well: a `172px` band, warm `o-orange` fill, `2px` **dashed marigold** edge, `.minion` label in `ink-soft`. Hover takes the highlight-yellow fill, `n-deep-grey` label and a softened `radius-m`; the dashed marigold edge is held in **both** states, because the fill is only 1.15:1 against paper and that edge is the sole thing defining the zone. It is a real `<button type="button">` with an `aria-label` that tracks state ("Add a photo" / "Change photo") — the `<input type="file">` beside it is `display:none`, so this control is the only route to a photo and must be operable from the keyboard.

### Radio card (`.c-identify-option`)
A photo card acting as one option in a `role="radiogroup"` — the plant-identification suggestions. Because the card is a photograph, selection cannot be a fill, so it is carried by a **mark that is always drawn**: an `18px` disc pinned `--space-sm` from the top-inline-end corner, white with a `2px` `n-dark-grey` ring when unchosen, filled `--color-b-cyan-deep` with a `2px` white inner ring when chosen. A `1px` white outer glow keeps it legible over any reference photograph. The card edge follows: `1px` `n-dark-grey` at rest, `--color-b-cyan-deep` plus a `1px` ring (2px, no reflow) when chosen. **Hover is the card lift only** (`0 8px 24px rgba(0,0,0,0.15)`), edge unchanged — hover previously shared the selected border colour, so crossing the group made every option read as chosen. Focus is the standard `--sem-focus-color` outline at `2px` offset, which reads distinctly from selection because the mark stays empty.

### Inputs / Fields
- **Style:** `1px` `sand-line` border, `paper` fill, `4px` radius, `8px 12px` padding, Inter `0.875rem` `ink` text, placeholder at `ink-soft/50`.
- **Label:** above the field, Spline-mono-idea in Inter — `text-xs`, semibold, uppercase, `tracking-wider`, `font-variant: small-caps`, `ink-soft`.
- **Focus:** `2px` marigold ring, `1px` paper offset, border → marigold, **fill → marigold** (a strong, deliberate focus state) — this suits single-shot forms. For a **repeated-entry field** (add-a-plant, a tag input the user returns to after every submit) drop the fill flip and keep ring + border only: a background flash on each entry fights the text being typed. Reference: `.c-scheme-start__field`. Also theme `caret-color` to marigold.
- **Error:** border → marigold, ring → marigold; message below in `text-xs` marigold with `role="alert"`.
- **Underline-field variant** (`.c-underline-field`): a bottom-rule field — `1px` `n-dark-grey` line that thickens to `2px` `--sem-focus-color` when `.is-active`. Used for the in-place editable values on the plant detail page.
- **Disabled:** `opacity: 0.5`, `cursor: not-allowed`.

### Navigation
- **App header** (`.c-head`): flush row — wordmark left (`n-deep-grey`, `32px` tall), user menu right. Below it, `.nav-sections`: an equal-width flex strip of `Home / Plants / Schemes`, each item a bottom-`2px`-transparent-border tab. Hover → marigold underline; active → marigold underline *and* marigold text + `font-medium`. Bottom hairline on the strip in `--sem-border-color`.
- **User menu:** a circular moss-toned initials roundel opening a Radix popover (email + ghost "Log out").
- **Mobile:** the nav strip stays horizontal and equal-width (3 short labels fit); the header stays flush.

### Popover / Menu (signature shell)
`.o-popover` is the single shared shell for every dropdown (user menu, scheme actions, plant filter). White, `1px` `--sem-border-color`, `4px` radius, the low menu shadow, `--space-xs` padding, `--space-sm` gap. Items (`__link` / `__item`) are full-width, `--space-sm`/`--space-md` padded, hover → highlight-yellow, `.is-danger` hover → smoke-red, focus-visible → `2px` `--sem-focus-color`.

### Image Plate (signature)
See Shapes. A framed, matted, captioned photograph with a mono specimen number — the device that makes an editorial page read as a catalogue. Reserved for marketing / editorial surfaces; in-app imagery is otherwise plainer (bottom-rounded, uncaptioned).

### Planting schemes hub (`c-scheme-hub`)

The `/plant-scheme` workbench: start a scheme, carry on with a draft and reopen a finished plan on one page. It replaces the old A/B entry doors and both picker steps (`/plant-scheme/existing` and `/scratch` redirect here), and is built alongside the live `/schemes` it is meant to replace. An Operate surface — the retired front door's photo plate and coloured choice fields are gone. Contract in `SchemesHub.tsx`; styles in `_scheme-hub.scss`.

- **Layout:** see Layout → Hub measure. Head: `.paragon .kirk` "Planting schemes" and one `.primer` lead at `--measure`, closed by a hairline.
- **Start panel** (`.c-scheme-start`, `StartPanel.tsx`): the page's white sheet with a spring-washed head (`.pica .kirk` "Plan a new scheme" + `.brevier` lead). Top to bottom: the **starting tray** — mono "Starting plants" and an `N / 5` count; chosen plants as `2.5rem` pills (photo roundel for a garden plant, leaf on the accent wash for a typed name, round remove); an empty tray is one dashed slot that says what goes in it — with the full-width primary **Start** button directly beneath, so the action stays in the first viewport however long the garden runs. Then **one field** ("Add a plant", search icon, repeated-entry focus) that filters the garden grid and, for a name not in the garden, offers an inline "Add “…” as a plant you're considering"; a typed name that exactly matches a garden plant selects that record instead. Then **In your garden**: square photo tiles (`auto-fill minmax(5.5rem, 1fr)`, two-line `.minion` names) scrolling inside the panel. Tiles are `aria-pressed` buttons using the Radio card grammar made multi-select — a `1.25rem` square mark drawn in both states (white with an `n-dark-grey` ring → `cyan-deep` fill with a white check), a `2px` inset `cyan-deep` edge when chosen, a soft lift on hover. Five plants maximum; at five the field disables with a note and unchosen tiles disable.
- **Why one tray:** the two old paths differed only in where a plant came from. The spec's split still holds downstream (`startScheme` in `PlantSchemeContext`): garden plants are resolved records and start on the scheme list; typed names are chat context only. The path accent is `existing` when any garden plant was chosen, otherwise `scratch`.
- **Carry on** (`.c-scheme-drafts` / `.c-scheme-draft`, `DraftShelf.tsx`): shown only when drafts exist, ahead of the plans. Each draft is a white link card — a summer-washed well holding its own `BorderElevation` drawn at rest (silhouettes for what is on its list, dashed ghosts for empty tiers: a half-planted border rather than a stat), then a `.long-primer .kirk` name, `.minion` "N plants on the list · date", the last message (mono speaker, two-line clamp) and a mono "Carry on →". Mocked in `mockDrafts.ts` until conversations persist.
- **Finished plans:** the existing `SchemeList` catalogue cards. With plans, the annotated example folds behind a "How a scheme comes together" `<details>`; with none, it shows open under that heading.
- **Annotated example** (`.c-scheme-example`, `SchemeExample.tsx`, `_scheme-example.scss`): the journey's steps, each beside the real part it produces (starting-plant pills, a real question with quick replies, an open sheet with `BorderElevation`, `FloweringYear` and two `PlantCard`s whose "why this fits" is computed by `buildMatchNote`). Early-summer accent, a season neither the panel nor the drafts use. Deliberately non-interactive.
- **Authored moment:** a plant settling into the tray (`scheme-pick-in`: `scale(0.9 → 1)` with an accent-wash fade, from an already-visible state, emphasis curve). The example keeps its own draw-in when it is first seen open; the two rarely meet in one viewport.
- **Preview params** (`page.tsx`): `?drafts=0`, `?plans=0`, `?garden=0` for the empty states.

### Scheme journey step marker (`c-scheme-journey`)

`_scheme-journey.scss`, on the question flow. A hairline-ruled row: mono label left (`Planting scheme`), a two-segment progress track (reached segments in the path's `--_accent`, `1.75rem` / `2.5rem` bars, `0.25rem` tall), question `N / 4` mono right. The folio device doing wayfinding — the sequence carries real information, so it is *not* the banned decorative eyebrow.


### Chat (`c-chat`) — reusable conversation surface

A conversation with Plotted, styled as an exchange of notes in a garden notebook. Domain-neutral and self-contained (styles in `styles/components/_chat.scss`, primitives in `_components/ChatLog.tsx`) so it can be lifted into any Plotted context; a host supplies the messages and wiring. Plotted's scoped planting assistant (`/plant-scheme/chat`) is the built reference — both the Q1–Q4 question flow and the destination workspace run on it.

- **Log** (`.c-chat__log`): no panel, no border, no inset padding — messages sit open on the page ground, not framed inside anything; scrolls internally with a **themed thin scrollbar** (`sand-line` thumb). `role="log"` + `aria-live="polite"`; auto-scrolls to newest unless the reader has scrolled up. Height is context-set: `--short` (`max min(52vh, 34rem)`, question flow) and `--bounded` (`min(60vh, 40rem)`) cap it where the page scrolls; inside the desktop workspace shell (`≥52rem`) it instead `flex`es to fill the space between the nav and the composer. The `--bounded` variant also carries a **foot gradient-mask** (`mask-image`, last `--space-lg`) so the scrollback dissolves toward the composer instead of hard-cutting, with `--space-xl` end padding keeping the newest message clear of the fade.
- **Bubbles** (`.c-chat__bubble`, `8px` radius): assistant on `paper-deep`, borderless; user on `white` with a hairline. Each squares **one corner** toward its speaker (`--radius-s`) — the familiar chat tell. Text at the `primer` step, `n-deep-grey`. Distinction is alignment + fill + the attribution line, never colour alone; **marigold is not a bubble colour**.
- **Attribution** (`.c-chat__from`): a mono "Plotted" with a single-stroke sprout mark in `--color-r-marigold` — the one brand touch, shown once at the head of a run of assistant turns.
- **Typing indicator** (`.c-chat__typing`): three `ink-soft` dots, `paper-deep` bubble, the `chat-typing` keyframe (see Motion). `role="status"` with a visually-hidden "Plotted is thinking". This is the surface's one authored moment; static under `prefers-reduced-motion`. It owns a stall timer: after `STALL_MS` (6s) a visible `.c-chat__typing-stall` caption ("Still thinking…") fades in beside the dots and the visually-hidden label updates to match — Visibility of System Status for the genuinely slow reply, without adding a second authored moment (an incidental fade, not the emphasis curve).
- **Failed turn** (`.c-chat__failed`, `SendFailedNotice` in `ChatLog.tsx`): the calm way a turn that didn't go through is shown — a network drop or model error, once this is wired to a real endpoint. Attaches under the optimistic bubble it belongs to (the bubble itself is untouched — still what the gardener said or chose); only this line reads as a problem. `role="alert"`, an `alertTriangle` icon, `"Couldn't send."`, then **Retry** and **Discard** as underlined inline actions. Text colour is `--sem-color-error-bg` (the fresh error red), not `--color-r-marigold` — marigold clears only ~3:1 against paper, below the 4.5:1 AA floor for body-sized text (a real gap in the marigold-error-text convention `Input.tsx`/`Select.tsx` use elsewhere; not one worth repeating here). Hover darkens toward black (`color-mix`) rather than swapping to vermillion, which also failed contrast. Both hosts that use `c-chat` (`ChatPane.tsx`, `QuestionFlow.tsx`) drive this from the same shape: at most one turn in flight or failed at a time, composer and any choose-one rows lock until it resolves, and there are always exactly two ways out — **Retry** (always attempts for real; a failed turn's own wording can't be edited, so this is its only path forward) or **Discard** (drops it, back to idle, never silent). Both components share the same dev/QA trigger: typing the literal string `/fail` into the composer and sending it — or, for a direction pick, having `/fail` sitting in the composer at the moment a row is clicked — simulates that turn failing, the same crude-but-honest mock idiom as `DISLIKE_MARKERS` in `PlantSchemeContext.tsx`. The simulated failure takes long enough (7.5s) for the stall caption to show first, so one test run exercises both new states.
- **Composer** (`.c-chat__composer`): **the blank page.** Everything above it is a record of something already said — oat, hay, clay, all tinted paper — so the one place the gardener writes is the only *pure white* surface on the chat, given a real edge and its own attribution. A mono `.o-type-label` heads it (`✎ Your reply` / `✎ Your answer`) — a real `<label htmlFor>`, set in the same mono-and-mark treatment as the assistant's `.c-chat__from`, so the two voices bracket the exchange and a text input, unexpected in a gardening app, is impossible to miss. Below it: an auto-growing `<textarea>` (`field-sizing: content`, `8px` radius, **`white` fill**, marigold `caret-color`) whose edge follows the `.c-underline-field` grammar exactly — `1px` `n-dark-grey` at rest, `2px` `--sem-focus-color` when it has the caret (border + a `1px` ring, no reflow, no fill flip per the repeated-entry rule). Beside it a `44px` **roundel send button**: empty, it is a quiet outline sharing the field's edge with an `n-dark-grey` arrow — *waiting, not broken* — and the `--color-r-marigold` fill **rises into it from the base** (`::before`, `scaleY`, default curve) the moment there is something to say, arrow flipping to `r-white` (→ `o-vermillion` fill + near-black arrow on hover). That rise is the honest signal that this surface is live; it stays an incidental transition, so the typing dots keep the surface's one authored moment. Enter sends, Shift+Enter newlines; focus returns to the composer after a send. Set `--space-md` off the log above — a deliberate rhythm step down from the tighter title/log interval, not a rule or a box; it pairs with the log's foot-fade to mark the composer as its own zone.
- **Quick replies** (`.c-chat__chips` / `.c-chat__chip`): pill buttons, hairline, `paper` fill, highlight-yellow hover, `2px` `--sem-focus-color` focus — real `<button>`s for the current turn only.
- **Inline attachment** (`.c-chat__panel`): a `clay` group (squared top-left toward the run) holding a plain `brevier` lead-in and cards — plant suggestions (`.c-suggestion`) or a choose-one set of `.c-chat__option` plates. Not the mono label treatment; these titles are sentences.
- **Choose-one options** (`.c-chat__options` / `.c-chat__option`): a *set* of full-width rows stacked in one column (`display: flex; flex-direction: column`) — a plain vertical list, since the row is a sentence-length choice, not a card that benefits from a two-up grid. Each row is `oat`, hairline, `radius-m`, laid out as a flex row with the text leading and a trailing **choose-one mark** held to the far end — the label is what you read, the mark is what confirms the pick, so it takes the quieter, secondary position. The mark is two Lucide glyphs (`square` / `squareCheck`, `18px`) stacked in one box and crossfaded with opacity + a `scale(0.7 → 1)` pop rather than swapped instantly: empty ink at rest, checking itself in on hover (still plain ink — a preview, not a commitment) and staying checked in `--sem-focus-color` once chosen, whether or not the pointer is still over it. The label is **bold Inter** at the `primer` step over a `minion` `ink-soft` blurb: bold because the row now carries its own weight with no figure above it to lead the eye, and Inter (not Fraunces) because this is a control label, the voice every other button in the app uses — the display face made an option read as a card title rather than something to pick. Three states, three treatments, per the Chosen-Is-Filled Rule: highlight-yellow **fill** for the pointer with the mark checking in in ink (the edge is held, never swapped, and hover never borrows the accent — a hover that already looked chosen would leave nothing left to say "this one actually is"), the **button lavender ring** for the caret (not the field/menu cyan outline — the cyan edge already means "chosen" on this object, and a focused row has to be unmistakable beside a chosen one), and the **checked mark in cyan + cyan edge** for the choice. Selection is exposed as `aria-pressed` on a labelled `role="group"` of buttons rather than a `radiogroup`: these act on click, so they are one-shot actions, and a real radiogroup would owe arrow-key navigation that moves the selection — a request fired per keypress.
- **A closed group is a record, not a dead end** (`.c-chat__option:disabled`, `.c-chat__options-reopen`): picking one closes the whole set, the same "current turn only" contract the quick-reply chips have. The chosen plate keeps its fill and its cyan edge; the ones not taken drop their fill to the panel ground and soften their edge, so a long scrollback reads back as the decisions that were made rather than as rows of live buttons the reader might click by mistake. The pick shows as chosen optimistically, on the same beat as the sent message beside it, so the plate never sits unmarked while the reply lands. Once genuinely committed (`entry.chosenOptionId`, not just the optimistic pick), a quiet **"Choose a different direction"** ghost action stays attached below the group — same convention as `.c-suggestion__remove` (ink-soft, marigold on hover/focus; a reversible secondary action, not a fresh accent). It only clears the stamp so the group re-opens; it never retracts anything that choice already posted (the assistant's reply, any suggestion cards already in the transcript) — picking again just adds another round, the same as choosing fresh. This is the direction flow's undo: without it, a wrong tap or a change of mind had no way back except free-typing a new message and hoping the model reinterpreted it. The button's own label says so — **"Choose a different direction — what's already here stays"** — rather than leaving that reassurance to be inferred at the one moment (undoing an AI decision) a first-time user is most likely to hesitate.
- **Tier-grouped suggestion panels** (`SuggestionPanel.tsx`, `.c-chat__panel-group`): above `TIER_GROUP_THRESHOLD` (4) plants, a suggestion panel splits into the same back/mid/ground groups the scheme-list pane uses (`.c-chat__panel-group-label`, the `.o-type-label` treatment) instead of one flat list — the initial post-Q&A scheme is six plants, one over the ≤4-visible-choice ceiling this route holds everywhere else (the direction panel is exactly four). Smaller follow-up panels (two plants) stay flat; grouping two cards into groups of one would be noise. The staggered "planting" entrance delay is computed once across the whole panel regardless of grouping, so it still reads as one wave landing.
- **"Why this fits"** (`.c-suggestion__match`, `matchNote.ts`): a quiet, ink-soft, check-led line tying a suggestion card back to the gardener's own aspect/soil answers (`"Suits your full sun, free-draining soil."`) — without it, a suggestion panel read as generic plant matching with no visible reasoning behind it. Built from real per-plant `sun`/`soil` fields on the mock data, matched against the answer text with the same crude keyword-sniffing as `DISLIKE_MARKERS` — mocked, not real NLU, but never fabricated: silent (no line at all) when the gardener skipped the question or nothing genuinely lines up, rather than inventing a match. Sits directly under the editorial `note`, **before** the badges row: both `note` and the match-note are prose reasoning about the plant, while badges are tags — a different kind of thing. A design critique found the two "why" registers (editorial + personalised vs. trait badges) reading as one undifferentiated pile when the match-note sat after the badges; grouping the prose together and letting the badges start their own visual zone afterward is the fix. Still its own quieter register (no accent colour, no badge treatment) — reasoning, not a description or a trait.

### Scheme workspace (`c-scheme-workspace`) — the destination

The `/plant-scheme/chat` route: `phase: "questions"` runs the chat inside the journey step marker (`.c-scheme-journey`, count slot = `N / 4`); `phase: "scheme"` is the destination — a **two-pane workspace** (`.c-scheme-workspace`) that drops the `.o-page` product measure and fills the viewport width (see the Narrow Column Rule). Above `52rem` it is a fixed-height `100dvh` shell: the conversation flexes to fill, the width-capped **scheme-list panel** sits beside it, and each pane scrolls on its own (the page does not). Below `52rem` the panes stack, chat then list, and the page scrolls. The destination has no visible page title — a visually-hidden `<h1>` ("Building your scheme", matching the route `<title>`) anchors the outline, and "Conversation" and "Scheme list" are the two `<h2>` panes, each the heading of a real `<section>` landmark (`aria-labelledby` on the chat pane, `aria-label="Scheme list"` on the list pane). Two independently-scrolling panes of very different heights mean DOM/tab order (chat pane, then list pane) doesn't track pixel position — reordering the DOM to chase visual proximity isn't right here (or generally possible, for two independently-scrolling regions) and trapping focus inside a pane is worse, so the fix is a real landmark on both panes: a screen-reader user can jump directly between "Conversation" and "Scheme list" via landmark navigation rather than serially tabbing through every control in one to reach the other. **Landmarks are AT-specific, though** — a sighted, keyboard-only user with no screen reader gets no benefit from them and still hits the same disorienting jump. Their equivalent is a **skip-link pair** (`.c-scheme-chat__skip-link`, `.u-skip-link` in `_utilities.scss`): "Skip to scheme list →" as the next tab stop leaving the composer, "← Skip to conversation" as the first tab stop entering the list pane — each a real, visually-hidden-until-focused `<a href="#…">` targeting the other pane's section (`tabIndex={-1}` makes a plain `<section>` a valid link target). Either direction, the next Tab press after crossing lands somewhere named, never a silent jump into an unrelated control. The mock assistant delay (`~700ms`) shows the optimistic user message + typing indicator before the reply lands — the rhythm a streamed LLM response will have.

The scheme-list panel (`.c-scheme-list`) is drawn as a **living border sheet**, not a list — the conversation's output made visible as a border taking shape. Top to bottom:

- **Letterhead**: the season-washed head band with mono label and count, the same band the hub's start panel opens with.
- **Border elevation** (`.c-scheme-elevation`, `BorderElevation.tsx`): an engraved cross-section on a shared ground line — every *tiered* plant draws one silhouette in the path's `--_accent` (back → tall grasses/spires/shrub crowns, mid → mounds/flower spikes/umbels, ground → mats/tufts/creepers; three variants per tier, slot + variant chosen by tier index, keyed by plant id so nothing redraws). An empty tier holds a **dashed ghost** silhouette — the schedule's ghost-row idea sketched — so "nothing at ground level yet" is visible, not a stat. A visually-hidden sentence gives the same census to screen readers. Garden-origin plants (no resolved tier) are not sketched. Held to a centred figure measure (`--_figure-measure`, ~`22rem`) so it stays diagram-scale rather than stretching across a wide sheet.
- **Flowering year** (`.c-scheme-year`, `FloweringYear.tsx`): twelve month cells (mono initials) that fill with their **flowering-season** `--sem-flowering-*-bg/-fg` pair when any listed plant flowers that month; quiet months stay `paper-deep`/`ink-soft`. The current month carries a small `--_accent` tick — the gardening year is the product's clock. Cell fills are incidental transitions; a visually-hidden "In flower May to October." mirrors it. Centred on the same `--_figure-measure` as the elevation above it, so the two figures align and the cells stay legible.
- **Cards** (`.c-scheme-list__grid` / `.c-scheme-list__item`): within each group ("From your garden", then the tier groups) the `.c-suggestion` cards flow in a responsive grid — the shared `auto-fill` / `minmax(min(100%, 200px), 1fr)` / `md`-gutter recipe (see Layout "Grid & rhythm"), so the column count follows the pane width and the group's plant count; cards stretch to equal height per row. No specimen numbering — the stamp and its `scheme-stamp-in` pop are retired here (the numbered roundel stamp survives only in the annotated example).

Arrivals — a fresh suggestion panel's cards, a fresh direction panel's rows, and cards and silhouettes on the sheet — run "the planting" (see Motion). This is the workspace's one authored moment; the elevation and year strip themselves are still surfaces that react, never perform.

## Do's and Don'ts

### Do:
- **Do** keep the page ground `#FAF6EC` *with* its noise grain (multiply, ~8%). White is for raised cards, dialogs and menus — and for the chat composer, the one field on a tinted surface that has to read as an unwritten page.
- **Do** set product-UI headings in Fraunces bold roman (`.kirk` / 600); use Fraunces italic 400 only on marketing/editorial surfaces (the Two-Register Rule).
- **Do** use Spline Sans Mono, uppercase, `0.12–0.16em` tracking for eyebrows, plate numbers, field labels and botanical meta.
- **Do** render botanical Latin italic, always — including inside a bold-roman title, where it reads as bold-roman with an italic species.
- **Do** carry structure with 1px hairlines (`--sem-border-color`) and tonal paper layers; add shadow only on hover / open / overlay.
- **Do** route every stateful colour through a `--sem-*` token and an object-private `--_*` property — never a raw `--color-*` in a modifier.
- **Do** keep marigold rare: primary action and active nav, ≤10% of a screen.
- **Do** let colour enter through plant content — photos and the trait/sun/season badge families — while chrome stays calm.
- **Do** treat the planting schemes hub (`/plant-scheme`) as a workbench — start, carry on and reopen on one page. Its season-washed panels and the annotated example belong to the scheme journey; on another Operate screen they are drift.
- **Do** carry the scheme's flowering-season accent through the conversation via `--_accent` / `--_accent-wash`, and reuse the journey chrome (`.c-scheme-journey` step marker, the border elevation, the tray pill) rather than reinventing it per screen.
- **Do** hold app pages to the ~800px `.o-page` measure; the 1120px container is a marketing device, the ~1000px companion measure is the dashboard's alone, full width is the `/plant-scheme/chat` workspace's alone, and the ~90rem two-column workbench is the `/plant-scheme` hub's alone — the Layout section lists every exception.
- **Do** build any new conversation on the `c-chat` primitives (`_chat.scss` / `ChatLog.tsx`) — a boxless internally-scrolling log with `role="log"` + `aria-live` (height capped via `--short` / `--bounded` or flexed to fill; `--bounded` foot-fades toward the composer), attribution once per run, a typing indicator before a reply, an auto-growing composer set a rhythm step off the log, focus back to the composer after send.
- **Do** build a choose-one set as a *set* — full-width rows stacked in one column, label leading, a mark drawn in both states held to the trailing edge — and close it once the choice is made, so scrollback reads as a record rather than as live buttons (see Chat → Choose-one options).
- **Do** take every focus ring and active-field edge from `--sem-focus-color` (Cyan Deep) — the light `--color-b-cyan` is a fill/selected tint and is too pale to be an indicator.
- **Do** honour `prefers-reduced-motion` for every animation (all current keyframes already opt out).
- **Do** give every async chat turn a real retry/discard path (`SendFailedNotice` in `ChatLog.tsx`) rather than letting a failure be silent — at most one turn in flight or failed at a time, composer/rows lock until it resolves, exactly two ways out.
- **Do** hold every decision point in the chat to ≤4 visible options — split a longer suggestion panel into tier groups (`SuggestionPanel.tsx`) rather than presenting more at once.
- **Do** give a closed choose-one group a way back (`.c-chat__options-reopen`) once it's genuinely committed — a permanent choice with no undo is a dead end, not a decision.
- **Do** give each pane of a multi-pane layout a real landmark (`<section aria-label>` / `aria-labelledby`) rather than trying to make DOM tab order track pixel position — that only works for one column, and reordering or focus-trapping to chase it is worse than the mismatch itself.
- **Do** pair that landmark with a `.u-skip-link` for keyboard-only users with no screen reader — landmarks are AT-specific and don't help them; a visually-hidden-until-focused `<a href="#…">` to a `tabIndex={-1}` section is the equivalent affordance.

### Don't:
- **Don't** introduce a third palette or bring the marketing `moss` / `terra` / `sage` greens into product UI — `styles/abstracts/_variables.scss` is the single source of truth.
- **Don't** use `--color-ink` for body copy — running text is `--color-n-deep-grey`; `ink` / `ink-soft` are for headings and labels.
- **Don't** drift toward the plant-ID app look: no dark UI, neon accents, camera-first chrome, or gamified score badges. The "N/12 spotted" hook is a gentle prompt, not a scoreboard.
- **Don't** drift twee: no script or hand-lettered fonts, watercolour blobs, floral borders, or pastel whimsy.
- **Don't** set essential copy over a photograph — captions and copy sit beside or below the image (see Shapes → image plate).
- **Don't** copy the hub's start-panel washes, the drafts' elevation thumbnails or the annotated example onto another app route — they belong to the scheme journey, not the app at large (see Planting schemes hub).
- **Don't** give chat bubbles a marigold (or any accent) fill, or lean on colour alone to tell assistant from user — the split is alignment + fill tone + the attribution line. Keep the season accent on the *wrapper* chrome (`--_accent` on the workspace/list), never inside `c-chat`.
- **Don't** mix heading registers within a surface — no italic-400 section header inside the app, no bold-roman headline on a marketing page.
- **Don't** add dashboards, KPI tiles, stat walls or streak counters (a PRODUCT.md commitment).
- **Don't** put `--color-b-cyan` on a focus ring, a focus outline or an active-field border — that is `--sem-focus-color`'s job (the Focus Colour Rule).
- **Don't** let a control's boundary get *weaker* when it reacts. Three controls shipped with a hover that swapped a defined edge for pale cyan or for the hover fill itself, leaving the hovered state with less definition than the resting one. Where the highlight-yellow hover also takes the border, the control must already carry a fill at rest; a transparent or lightly-tinted control keeps its edge and changes only the fill.
- **Don't** set a control label in Fraunces. The display face is the heading voice; on a button or an option plate it makes the control read as a card title — as content rather than as something to pick. Inter `--font-weight-medium` is the label voice for controls.
- **Don't** use `--color-r-marigold` for error text on paper — it clears only ~3:1, below the 4.5:1 AA floor for body-sized text. Use `--sem-color-error-bg` for inline error copy instead (see the Failed turn entry under Chat).
- **Don't** reach for `role="radiogroup"` on options that act on click. Arrow keys in a radiogroup move the selection, which there means firing a request per keypress; a labelled `role="group"` of `aria-pressed` buttons is the honest shape and owes no roving tabindex.
- **Don't** build a click target as a `div` with `onClick`. Every one of them in this codebase turned out to be the only path to its action, with no tab stop, no accessible name and nowhere to put a focus state.
- **Don't** hardcode radius, spacing or colour values — use the scale tokens; Stylelint checks them.
- **Don't** put a resting shadow on a surface to make it "pop" — use a tonal step or a hairline.
- **Don't** touch `styles/objects/plant-detail.scss` or the `.plant` / `.plant-detail` / `.plant__frost-tolerance` selectors — they're fenced off for a dedicated refactor.
- **Don't** add new component CSS as `components/ui/*.module.css` — global SCSS/ITCSS (`styles/objects/`, `styles/components/`) is the settled architecture.
