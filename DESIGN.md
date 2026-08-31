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
- **Cyan** (`oklch(78.91% 0.07815 206.15)`): focus-only. The 2px focus outline on inputs, popovers, autocomplete and text buttons. Not a decorative colour.
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

**The Highlight-Yellow convention** *(established pattern, not an invariant).* `highlight-yellow` is the one reactive colour that marks whatever the pointer is on. Keep every new interactive object consistent with it on hover/active.

**The Semantic Field exception** *(scoped to the `/plant-scheme` journey).* The flowering-season hues normally appear only in small badges and roundels — "held in restraint" per the Overview. The planting-scheme flow is the one sanctioned place a `--sem-flowering-*` pair carries **large surfaces and a whole path's accent**:

- On the entry, the choice plates (`.c-scheme-plate.is-established` / `.is-new`) each own an ~8rem colour field (~45% of the card) — `--sem-flowering-summer-*` for the established garden, `--sem-flowering-spring-*` for the one just starting — with the body note tinted from the season `-fg` rather than grey.
- Each path then **carries that season forward** as its accent through the steps that follow: the "from scratch" journey (`.c-scheme-scratch`) is spring end to end — the progress track, the plate-number stamps, the list "letterhead", the what's-next aside. Routed through `--_accent` / `--_accent-wash` private props.

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

The rule governs headings, not the italic voice entirely. In-app, Fraunces **italic 400 is allowed for a short editorial aside** — a *non-heading* line that speaks in Plotted's voice or looks ahead, set apart from the working copy (e.g. the "what's next" note on a journey step, `.c-scheme-scratch__next`). It joins the existing in-app non-heading Fraunces use (the roman-400 "editorial display-body"). One aside per view; never a run of body copy, never a heading.

**The Mono Label Rule.** Eyebrows, specimen/plate numbers, field labels and botanical metadata all use `.o-type-label` — Spline Sans Mono, uppercase, `letter-spacing: 0.14em`, weight 500, `.minion` size. One class, no per-context variants; it is the type element that carries the "tech-aware" half of the identity.

**The One Scale Rule.** Type size comes only from the printers'-names step classes (`minion → canon` + `long-` variants) in `styles/base/_typography.scss`, and line-height only from `.o-type-leading--*`. Tailwind `text-*` / `font-*` / `leading-*` and arbitrary `text-[Npx]` are not part of this system — they are being converted out. Never introduce a new size value; map the need onto the nearest step.

**The Latin-in-Italic Rule.** Botanical names (genus, species, cultivar) are always rendered italic, whatever the surrounding type.

## Layout

Three containers, chosen by surface intent:

- **Product measure** — `.o-page`: `max-width: 800px`, centred, `padding: var(--space-md)` (16px). The default for every authenticated app page — a narrow, readable, single-task column.
- **Companion measure** — the dashboard (`/dashboard`) only: a single vertical stream at `max-width: ~1000px`, still centred, still one column. The dashboard is a check-in surface that stacks four peer content blocks (recent plants, weather, garden visitors, shopping list); it earns the extra width so cards and horizontal scrollers can breathe and, on desktop, resolve into inline rows rather than scroll. It does **not** become multi-column. No other app route uses this measure.
- **Editorial measure** — marketing `WRAP`: `max-width: 1120px`, `padding: 48px` stepping to `24px` at ≤860px and `18px` at ≤480px. Wider, plate-and-column compositions.

**Grid & rhythm.** Card collections use `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` with `gap: var(--space-md)` (both `.o-card-grid` and `.c-plant-grid`). Vertical rhythm is the `.o-stack` object: `display: grid` with `gap` of `--space-sm` / `--space-md` / `--space-xl` (compact / default / spacious). Horizontal groupings use `.o-row` (flex, `align-items: center`, `gap: --space-sm`) with `--space-between` and `--align-top` modifiers.

**Spacing scale.** `--space-base: 1rem`; steps `xs 4px · sm 8px · md 16px · lg 24px · xl 32px` (0.25× / 0.5× / 1× / 1.5× / 2×). Use scale tokens, not raw values — Stylelint validates custom-property names against the known token list.

**Breakpoints.** `--breakpoint-tablet: 860px`, `--breakpoint-mobile: 480px` (consumed as Tailwind `max-tablet` / `max-mobile`). These are the project's own; a stray `sm:` (640px) in `Input.tsx` is off-system.

**Responsive behaviour.** Marketing multi-column grids collapse to a single column at `max-tablet`; hero/ethos two-up layouts stack; display type drops to `clamp()` ladders (`~76px → clamp(34px, 9.6vw, 46px)` at mobile). The product measure is already narrow, so app pages mostly reflow rather than restructure. The dashboard is the one app surface that meaningfully restructures across width: its per-block horizontal card scrollers stay scrollers on mobile and become inline card rows (3–4 shown, overflow behind "View all") once the companion measure has room.

### Named Rules
**The Narrow Column Rule.** App pages hold to the ~800px `.o-page` measure — one readable column, one task. The 1120px editorial container is a marketing device and never appears in the app. The **sanctioned width exception** is the dashboard, which runs the ~1000px companion measure (still one centred column, never multi-column) because it is a stack of peer check-in blocks rather than a single task. A new app route wanting extra width is drift, not a precedent.

A second, narrower exception buys *immersion, never width*: the `/plant-scheme` entry hero (`.c-scheme-hero`) is a full-bleed photographic band. Its content still respects the ~800px measure; only the band itself breaks the `.o-page` inset — to the viewport edges on a phone (`≤32rem`: `margin-inline: calc(var(--space-md) * -1)`, radius dropped, `aspect-ratio` shifting `2/1` → `4/5`). It stays a single centred column.

A third: the `/plant-scheme/chat` **workspace** (`.c-scheme-workspace`) takes the dashboard's ~1000px companion measure, for the same reason — two peer panes (conversation + scheme list), not one task. It never becomes a third column, and the question-flow phase of the same route keeps the 800px measure.

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
- **`--transition-easing-emphasis`** (`cubic-bezier(0.16, 1, 0.3, 1)` — exponential ease-out, "settling toward the light"): the **one authored moment** on a surface. The scheme-entry plate lift and engraving bloom; the scheme-scratch schedule row easing in as it is added. Reserve it for that single deliberate motion — a page where every transition uses the emphasis curve has no authored moment, just noise.

Named keyframes: **`chat-typing`** (`_chat.scss`) — three dots pulsing opacity + a `0.125rem` rise, `1.2s` staggered `0.15s`, `infinite`; the chat surface's authored moment while the assistant composes. Static (`opacity: 0.55`) under reduced motion.

**"The planting"** (`_scheme-chat.scss`) — the scheme workspace's authored moment: one orchestrated response to a plant joining the scheme, on the emphasis curve. `scheme-item-in` (fade + `-0.25rem` settle) eases the list row and the chat suggestion card in, `scheme-card-wash` flashes the card from `--_accent-wash` to white, `scheme-stamp-in` pops the specimen roundel, and `scheme-elevation-draw`/`-dot` draw the plant's silhouette up from the ground line (strokes are `pathLength`-normalised so one dash pair animates any shape; flower-head dots bud a beat after their stem). All share a per-item `--_delay`, `0` for a single add and staggered (~70–90ms per item) when a populated sheet or a fresh suggestion panel first arrives — a scheme lands as a planting, not a dump. Every keyframe is `animation: none` under reduced motion.

### Named Rules
**The One Authored Moment Rule.** A surface gets one motion that is designed — orchestrated, on the emphasis curve, from an already-visible resting state. Everything else is incidental (default curve) or still. Every keyframe and transition honours `prefers-reduced-motion: reduce` — the authored moment degrades to an instant state change, never a jump.

## Shapes

Restrained, mostly-square corner language. Chrome (buttons, inputs, cards, dialogs, popovers, menus) uses the tight radius steps — `s 2px`, `m 4px`, `l 8px` — with `2px` on buttons and `4px` on cards and inputs being the common cases. Fully round forms are reserved for two jobs: `pill 32px` for **badges and chips** (static labels and interactive tags), and `roundel 50%` for **avatars, icon-only actions and sun roundels**.

**Chat bubbles** stay inside the scale: `l 8px` all round, with the **one corner nearest the speaker squared to `s 2px`** (assistant → bottom-left, user → bottom-right). It's the familiar chat tell, done with the existing steps rather than a new rounded value or a tail.

Borders are a first-class structural tool: `--border-width-hairline: 1px` for all resting structure, `--border-width-thin: 2px` for active/focus emphasis (active underline field, focus outline, AI-highlight card border).

**Signature silhouette — the image plate.** Photographs on editorial surfaces sit inside a `9px` solid `paper` mat within a `1px rgba(60,70,45,0.3)` frame, captioned below in Fraunces italic with a mono specimen number to the right (`Pl. 01 — …` / `001`). In-app image displays round only their bottom corners (`border-radius: 0 0 8px 8px`) so they sit flush under a header. The caption can also ride **over** a photograph rather than below it — on the `/plant-scheme` hero the italic descriptor and mono number are bracketed left and right across the base of the image (`justify-content: space-between`, warm white at ~82% over a bottom ink scrim): a magazine-plate treatment of the same device.

## Components

### Buttons
- **Shape:** near-square (`border-radius: var(--radius-s)`, 2px). Padding `0.75rem 1rem`, Inter `0.875rem`, `line-height: 1`, `inline-size: max-content`.
- **Primary:** marigold fill, warm off-white text (`--color-r-white`). Hover → vermillion fill, near-black text. The default; one per view.
- **Secondary:** transparent, near-black text, `1px` near-black border. Hover → highlight-yellow fill and border.
- **Ghost:** transparent, near-black text, no border. Hover → highlight-yellow fill. For low-stakes inline actions.
- **Danger:** near-black (`n-deep-grey`) fill, white text; hover lightens to dark-grey. Focus → 2px marigold outline, 2px offset.
- **Ghost-danger:** neutral (`ink-soft`) until hover/focus, then marigold. For destructive actions that shouldn't shout at rest.
- **Scheme:** lavender fill, lavender-white text — the Planting Schemes context only. Hover → vermillion.
- **Focus (all):** `box-shadow: 0 0 0 2px var(--color-paper), 0 0 0 4px var(--color-p-lavender)` — a lavender ring floated off the paper. (Note: some objects instead use a 2px cyan `outline` — the ring is the button-component convention, cyan is the field/menu convention.)
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

### Cards
- **Corner style:** `4px` (`--radius-m`), `overflow: hidden`.
- **Background:** white (raised). `--flat` variant is transparent, borderless.
- **Shadow strategy:** none at rest; `0 8px 24px rgba(0,0,0,0.15)` + `z-index: 1` on `--interactive:hover`; `scale(0.98)` + `opacity: 0.75` on `:active`.
- **Border:** none — the white fill against grained paper is the edge.
- **Structure:** `__media` (4:3, highlight-yellow well before load, badges pinned top-right), `__body` (`padding: var(--space-md)`, `gap: 0.375rem`, bold-roman Fraunces title with the botanical binomial italicised), `__footer` (sand-line top border at 60%).
- **Internal padding:** `--space-md` (16px) body; `0 16px 16px` footer.

### Inputs / Fields
- **Style:** `1px` `sand-line` border, `paper` fill, `4px` radius, `8px 12px` padding, Inter `0.875rem` `ink` text, placeholder at `ink-soft/50`.
- **Label:** above the field, Spline-mono-idea in Inter — `text-xs`, semibold, uppercase, `tracking-wider`, `font-variant: small-caps`, `ink-soft`.
- **Focus:** `2px` marigold ring, `1px` paper offset, border → marigold, **fill → marigold** (a strong, deliberate focus state) — this suits single-shot forms. For a **repeated-entry field** (add-a-plant, a tag input the user returns to after every submit) drop the fill flip and keep ring + border only: a background flash on each entry fights the text being typed. Reference: `.c-scheme-scratch__field`. Also theme `caret-color` to marigold.
- **Error:** border → marigold, ring → marigold; message below in `text-xs` marigold with `role="alert"`.
- **Underline-field variant** (`.c-underline-field`): a bottom-rule field — `1px` `n-dark-grey` line that thickens to `2px` cyan when `.is-active`. Used for the in-place editable values on the plant detail page.
- **Disabled:** `opacity: 0.5`, `cursor: not-allowed`.

### Navigation
- **App header** (`.c-head`): flush row — wordmark left (`n-deep-grey`, `32px` tall), user menu right. Below it, `.nav-sections`: an equal-width flex strip of `Home / Plants / Schemes`, each item a bottom-`2px`-transparent-border tab. Hover → marigold underline; active → marigold underline *and* marigold text + `font-medium`. Bottom hairline on the strip in `--sem-border-color`.
- **User menu:** a circular moss-toned initials roundel opening a Radix popover (email + ghost "Log out").
- **Mobile:** the nav strip stays horizontal and equal-width (3 short labels fit); the header stays flush.

### Popover / Menu (signature shell)
`.o-popover` is the single shared shell for every dropdown (user menu, scheme actions, plant filter). White, `1px` `--sem-border-color`, `4px` radius, the low menu shadow, `--space-xs` padding, `--space-sm` gap. Items (`__link` / `__item`) are full-width, `--space-sm`/`--space-md` padded, hover → highlight-yellow, `.is-danger` hover → smoke-red, focus-visible → `2px` cyan.

### Image Plate (signature)
See Shapes. A framed, matted, captioned photograph with a mono specimen number — the device that makes an editorial page read as a catalogue. Reserved for marketing / editorial surfaces; in-app imagery is otherwise plainer (bottom-rounded, uncaptioned). The one in-app exception is the scheme-entry hero below — a full-bleed, scrim-captioned photograph.

### Scheme entry (`c-scheme-entry`)

The `/plant-scheme` front door — a Persuade surface inside the app, the one place the catalogue turns its cover outward. It replaced a monochrome sand-on-sand card pair; colour enters through the photograph and the flowering-season palette, not through new chrome accents.

- **Hero** (`.c-scheme-hero`): a full-measure `next/image` photograph of a real garden (`/public/garden-hero-2.jpg`, team-supplied), `aspect-ratio: 2/1` on the product measure, `4/5` and edge-bled on a phone (`≤32rem`). A two-gradient warm scrim (`--color-ink` 84% → transparent rising from the base, plus a light top wash) carries the overlaid copy: a `.canon .kirk` headline and `.primer` lead in `--color-r-white`, a `2.5rem` hairline, then the over-photo image-plate caption.
- **Choice plates** (`.c-scheme-plate`, grid `auto-fit minmax(19rem, 1fr)`, stacking below ~40rem): white raised cards, `18rem` min height, borderless, a `1px` sand-line seat shadow at rest. The top `8rem` is the season colour field (see the Semantic Field exception) — it carries the engraving `__mark` and a hue-neutral tonal deepen toward the hairline divider, so the colour reads as lit rather than as a flat swatch. Body below on white: `.pica .kirk` title, season-tinted `.brevier` note, a mono `START →` affordance pinned to the base.
- **The hover moment** (`cubic-bezier(0.16, 1, 0.3, 1)`): the season field deepens to `--_field-deep`, the engraving blooms (opacity `0.4 → 0.52`, `scale(1.06)`), the plate lifts (`translateY(-2px)` + the card-hover shadow), the arrow steps `0.25rem`. One orchestrated response, not four separate effects; fully opted out under `prefers-reduced-motion`.
- **Focus:** the standard button ring (`0 0 0 2px paper, 0 0 0 4px lavender`) layered over the lift — no border swap, no reflow.

### Scheme journey — steps 2+ (`c-scheme-scratch`)

Past the entry, each path is an Operate surface (the task is to enter data), but it keeps the journey's warmth: its season accent carried through, the catalogue devices, the path engraving. `/plant-scheme/scratch` and `/plant-scheme/chat` are the built references; `/existing` should adopt the same chrome.

- **Step marker** (`.c-scheme-journey`): a hairline-ruled row — mono path label left (`From scratch`), a three-segment progress track (reached segments in the path's `--_accent`, `1.75rem`/`2.5rem` bars, `0.25rem` tall), `Step N / 3` mono right. This is the folio device doing wayfinding; because the sequence carries real information it is *not* the banned decorative eyebrow.
- **Plant schedule** (`.c-scheme-schedule`): the typed list drawn as a numbered plant schedule. A white raised panel; a **season-washed header band** ("letterhead") with a mono label and count; rows of `[stamp] [name] [remove]` — the number is an `--_accent` **roundel stamp** (`1.75rem`, white numerals) so a filling list becomes colour rhythm, the name is Fraunces roman at the `long-primer` step, remove is a `44px` icon button (highlight-yellow hover per convention, `2px` cyan focus). Ahead of the real rows sit faint **ghost rows** — dashed dividers, dashed empty stamps, the first carrying the empty-state prompt — so a short or empty list still reads as a form waiting to be filled, never as a dead panel. The path engraving (`marks.tsx`) sits behind at `~0.08` opacity.
- **Motion:** a real row eases in on add via `--transition-easing-emphasis` (translate + fade + a brief `--_accent-wash` flash); ghost rows and re-numbering are silent. This is the surface's one authored moment.
- **Add field:** a repeated-entry field — see Inputs / Fields (ring + border focus, no fill flip).
- **What's next:** one Fraunces **italic 400** aside in `--_accent` before the footer, setting up the step that follows (here, the LLM conversation) — see the Two-Register Rule's aside carve-out.

### Chat (`c-chat`) — reusable conversation surface

A conversation with Plotted, styled as an exchange of notes in a garden notebook. Domain-neutral and self-contained (styles in `styles/components/_chat.scss`, primitives in `_components/ChatLog.tsx`) so it can be lifted into any Plotted context; a host supplies the messages and wiring. Plotted's scoped planting assistant (`/plant-scheme/chat`) is the built reference — both the Q1–Q4 question flow and the destination workspace run on it.

- **Log** (`.c-chat__log`): a `paper` panel, `1px` hairline, `4px` radius, bounded height (`--bounded` `min(60vh, 40rem)` / `--short` `max min(52vh, 34rem)`) so the composer stays in view; scrolls internally with a **themed thin scrollbar** (`sand-line` thumb). `role="log"` + `aria-live="polite"`; auto-scrolls to newest unless the reader has scrolled up.
- **Bubbles** (`.c-chat__bubble`, `8px` radius): assistant on `paper-deep`, borderless; user on `white` with a hairline. Each squares **one corner** toward its speaker (`--radius-s`) — the familiar chat tell. Text at the `primer` step, `n-deep-grey`. Distinction is alignment + fill + the attribution line, never colour alone; **marigold is not a bubble colour**.
- **Attribution** (`.c-chat__from`): a mono "Plotted" with a single-stroke sprout mark in `--color-r-marigold` — the one brand touch, shown once at the head of a run of assistant turns.
- **Typing indicator** (`.c-chat__typing`): three `ink-soft` dots, `paper-deep` bubble, the `chat-typing` keyframe (see Motion). `role="status"` with a visually-hidden "Plotted is thinking". This is the surface's one authored moment; static under `prefers-reduced-motion`.
- **Composer** (`.c-chat__composer`): an auto-growing `<textarea>` (`field-sizing: content`, `8px` radius, `paper` fill, marigold `caret-color`, repeated-entry focus — ring + border, no fill flip) and a `44px` **roundel send button** in `--color-r-marigold` (→ `o-vermillion` on hover, `0.4` opacity disabled). Enter sends, Shift+Enter newlines; focus returns to the composer after a send.
- **Quick replies** (`.c-chat__chips` / `.c-chat__chip`): pill buttons, hairline, `paper` fill, highlight-yellow hover, `2px` cyan focus — real `<button>`s for the current turn only.
- **Inline attachment** (`.c-chat__panel`): a `paper-deep` group (squared top-left toward the run) holding a plain `brevier` lead-in and cards — plant suggestions (`.c-suggestion`) or choose-one `.c-chat__option` buttons (white, hairline, highlight-yellow hover). Not the mono label treatment; these titles are sentences.

### Scheme workspace (`c-scheme-workspace`) — step 3 destination

The `/plant-scheme/chat` route: `phase: "questions"` runs the chat inside the journey step marker (`.c-scheme-journey`, count slot = `N / 4`); `phase: "scheme"` is the destination — a **two-pane workspace** (`.c-scheme-workspace`) that widens the page to the ~1000px companion measure (see the Narrow Column Rule) and, above `52rem`, sticks the **scheme-list panel** beside the scrolling conversation. Below `52rem` the panes stack, chat then list. The mock assistant delay (`~700ms`) shows the optimistic user message + typing indicator before the reply lands — the rhythm a streamed LLM response will have.

The scheme-list panel (`.c-scheme-list`) is drawn as a **living border sheet**, not a list — the conversation's output made visible as a border taking shape. Top to bottom:

- **Letterhead**: the season-washed head band with mono label and count, as on the scratch schedule.
- **Border elevation** (`.c-scheme-elevation`, `BorderElevation.tsx`): an engraved cross-section on a shared ground line — every *tiered* plant draws one silhouette in the path's `--_accent` (back → tall grasses/spires/shrub crowns, mid → mounds/flower spikes/umbels, ground → mats/tufts/creepers; three variants per tier, slot + variant chosen by tier index, keyed by plant id so nothing redraws). An empty tier holds a **dashed ghost** silhouette — the schedule's ghost-row idea sketched — so "nothing at ground level yet" is visible, not a stat. A visually-hidden sentence gives the same census to screen readers. Garden-origin plants (no resolved tier) are not sketched.
- **Flowering year** (`.c-scheme-year`, `FloweringYear.tsx`): twelve month cells (mono initials) that fill with their **flowering-season** `--sem-flowering-*-bg/-fg` pair when any listed plant flowers that month; quiet months stay `paper-deep`/`ink-soft`. The current month carries a small `--_accent` tick — the gardening year is the product's clock. Cell fills are incidental transitions; a visually-hidden "In flower May to October." mirrors it.
- **Rows** (`.c-scheme-list__item`): each `.c-suggestion` card sits beside a **specimen-number stamp** (`.c-scheme-list__no` — the schedule's `--_accent` roundel device), numbered continuously down the sheet across the "From your garden" and tier groups. Re-numbering after a remove is silent.

Arrivals — a fresh suggestion panel's cards in the chat, and rows/silhouettes/stamps on the sheet — run "the planting" (see Motion). This is the workspace's one authored moment; the elevation and year strip themselves are still surfaces that react, never perform.

## Do's and Don'ts

### Do:
- **Do** keep the page ground `#FAF6EC` *with* its noise grain (multiply, ~8%). White is for raised cards, dialogs and menus only.
- **Do** set product-UI headings in Fraunces bold roman (`.kirk` / 600); use Fraunces italic 400 only on marketing/editorial surfaces (the Two-Register Rule).
- **Do** use Spline Sans Mono, uppercase, `0.12–0.16em` tracking for eyebrows, plate numbers, field labels and botanical meta.
- **Do** render botanical Latin italic, always — including inside a bold-roman title, where it reads as bold-roman with an italic species.
- **Do** carry structure with 1px hairlines (`--sem-border-color`) and tonal paper layers; add shadow only on hover / open / overlay.
- **Do** route every stateful colour through a `--sem-*` token and an object-private `--_*` property — never a raw `--color-*` in a modifier.
- **Do** keep marigold rare: primary action and active nav, ≤10% of a screen.
- **Do** let colour enter through plant content — photos and the trait/sun/season badge families — while chrome stays calm.
- **Do** treat the `/plant-scheme` entry as the app's one sanctioned Persuade surface — a full-bleed garden photograph and large `--sem-flowering-*` colour fields belong *there*; on an Operate screen they are drift.
- **Do** carry a `/plant-scheme` path's flowering-season accent through every step of that path, via `--_accent` / `--_accent-wash` — and reuse the journey chrome (`.c-scheme-journey` step marker, the schedule pattern, the path engraving) on the sibling steps rather than reinventing per screen.
- **Do** hold app pages to the ~800px `.o-page` measure; the 1120px container is a marketing device and the ~1000px companion measure is reserved (the dashboard, the `/plant-scheme/chat` workspace — the Narrow Column Rule lists every exception).
- **Do** build any new conversation on the `c-chat` primitives (`_chat.scss` / `ChatLog.tsx`) — bounded scroll log with `role="log"` + `aria-live`, attribution once per run, a typing indicator before a reply, an auto-growing composer, focus back to the composer after send.
- **Do** honour `prefers-reduced-motion` for every animation (all current keyframes already opt out).

### Don't:
- **Don't** introduce a third palette or bring the marketing `moss` / `terra` / `sage` greens into product UI — `styles/abstracts/_variables.scss` is the single source of truth.
- **Don't** use `--color-ink` for body copy — running text is `--color-n-deep-grey`; `ink` / `ink-soft` are for headings and labels.
- **Don't** drift toward the plant-ID app look: no dark UI, neon accents, camera-first chrome, or gamified score badges. The "N/12 spotted" hook is a gentle prompt, not a scoreboard.
- **Don't** drift twee: no script or hand-lettered fonts, watercolour blobs, floral borders, or pastel whimsy.
- **Don't** copy the scheme-entry hero photo or its coloured choice fields onto another app route — it is a scoped front-door treatment, not a new app-wide pattern (see Scheme entry).
- **Don't** give chat bubbles a marigold (or any accent) fill, or lean on colour alone to tell assistant from user — the split is alignment + fill tone + the attribution line. Keep the season accent on the *wrapper* chrome (`--_accent` on the workspace/list), never inside `c-chat`.
- **Don't** mix heading registers within a surface — no italic-400 section header inside the app, no bold-roman headline on a marketing page.
- **Don't** add dashboards, KPI tiles, stat walls or streak counters (a PRODUCT.md commitment).
- **Don't** hardcode radius, spacing or colour values — use the scale tokens; Stylelint checks them.
- **Don't** put a resting shadow on a surface to make it "pop" — use a tonal step or a hairline.
- **Don't** touch `styles/objects/plant-detail.scss` or the `.plant` / `.plant-detail` / `.plant__frost-tolerance` selectors — they're fenced off for a dedicated refactor.
- **Don't** add new component CSS as `components/ui/*.module.css` — global SCSS/ITCSS (`styles/objects/`, `styles/components/`) is the settled architecture.
