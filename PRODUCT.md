# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

UK domestic gardeners, from hobbyist to knowledgeable, tending a single private
garden of their own. They use Plotted across the gardening year — often on a
phone, sometimes standing in the garden — to check what the week ahead means for
their plants and to keep a record of what they grow. Desktop is supported but the
common scene is mobile, outdoors or at the kitchen table.

## Product Purpose

Plotted is a **seasonal companion** for a gardener's own garden. Its job is to
give people a reason to come back regularly by surfacing what is timely and
personal right now — weather for their location, what is coming into bloom, what
wildlife to look for, what to do next — grounded in the specific plants they
grow.

The plant catalogue (photos, botanical detail, flowering seasons, sun and soil,
habit) is the engine that makes the companion layer personal, not the end in
itself. An AI lookup fills in botanical detail from a species or cultivar name so
that starting and keeping a record costs the user almost nothing.

Success is a gardener who opens Plotted unprompted through the season because it
reliably tells them something useful about their own garden.

## Positioning

The defensible difference is the **whole composition**, not any single part: a
personal, photo-led plant catalogue + AI botanical enrichment + editorial,
AI-generated planting schemes, working together so the companion layer can speak
to this garden specifically. Any one piece in isolation (plant ID, a weather
widget, a companion-planting chart) is commodity; the assembled product tuned to
one gardener's plants and location is not.

## Operating Context

- One private garden per user; all plant, scheme, and garden data is
  row-level-security scoped to that user.
- A garden has a saved location (set once via manual search, never
  silently geolocated) that drives the weather forecast and other
  location-dependent content. Exeter is an unconfirmed display-only fallback.
- The gardening year is the product's clock: flowering months, "what to prune
  next", seasonal wildlife, and weather are all read against the current date and
  the user's location.
- Reference content that isn't user-generated (e.g. the garden birds list —
  images and copy) is curated and supplied by the team rather than crowd-sourced;
  wildlife-style features are designed as fixed, editable reference sets.
- Analytics / experimentation is a known future workstream (owned by Natalie on
  the team); an A/B framework is anticipated but not built.

## Capabilities and Constraints

Confirmed capabilities:

- Plant portfolio: add / edit / soft-delete plant entries, one photo per plant,
  list and grid views, and a plant detail page with every field editable in
  place.
- AI botanical lookup: from a species/cultivar name, auto-populate common names,
  sun needs, flowering season, eventual height/spread, and species/cultivar
  corrections, drawn from UK-oriented horticultural knowledge.
- Frost tolerance enrichment: a separate background lookup cached per species in
  `species_reference`, populated after the response via `after()`, with
  client-side polling on the detail page while a lookup is pending.
- Planting schemes: user selects plants from their library and receives an
  AI-generated, long-form editorial planting recommendation with embedded plant
  suggestion cards; schemes can be saved and named.
- Garden wildlife: a fixed list of common British garden birds the user can tick
  off as spotted, with a glanceable "N/12 spotted" progress hook.
- Weather: current conditions, hourly strip, and multi-day forecast for the
  garden's location via Open-Meteo (keyless; free tier is non-commercial —
  revisit on monetisation).
- Shopping list, dashboard, account, and email+password auth (Supabase),
  including a source-controlled React Email confirmation template.

Constraints and terminology:

- **Online-only.** The PWA is a shell only: manifest, icons, and a network-first
  navigation fallback (`offline.html`). No API, Supabase, or app data is cached
  or available offline; adding offline data access is a new feature, not an
  extension of the shell.
- The Next.js in this repo is a modified build with breaking API changes — always
  check `node_modules/next/dist/docs/` before writing framework code.
- AI enrichment runs after the response (via `after()`), never blocking the
  add/edit path; live update of an already-open page is done by client polling,
  not server push (server-push via `revalidatePath` inside `after()` was tried
  and does not work — documented dead end).
- "Garden" = the single per-user record holding location and settings; "scheme" =
  a saved planting recommendation; "portfolio"/"library" = the user's set of
  plant entries.

Explicitly undecided:

- **Monetisation.** No model chosen. Plotted is a free private beta ("Request
  access" waitlist). Do not design upgrade, paywall, or paid-tier surfaces until
  this is decided.

## Brand Commitments

- Name: **Plotted**. A wordmark component exists (`components/Wordmark.tsx`).
- Voice: calm, warm, trustworthy, botanical. "Built by gardeners, for gardeners."
  Deliberately **not** generic SaaS — "quietly clever, and never in the way of
  the gardening itself."
- Anti-pattern, binding: no dashboards-as-scorecards, no stats walls, no streak
  counters, no engagement-pressure mechanics. Return visits are earned with real
  seasonal usefulness, not gamification. The "N/12 spotted" hook is a gentle
  collection prompt, not a score.
- AI is scoped narrow on purpose: it does botanical lookup and scheme drafting
  and is invisible everywhere else. Not a chatbot, not a co-pilot.
- Typography in use: Fraunces (display, italic, weight 400) / Inter (body) /
  Spline Sans Mono (mono accents). Palette in use: paper / ink / sand / moss /
  terracotta warm-neutral world.
- An incumbent visual system exists in code (`styles/` ITCSS SCSS, mid-migration
  off Tailwind; token intent documented in `styles/docs/theme.md` and
  `styles/docs/design.md`) and a high-fidelity marketing homepage design
  reference (`docs/Plotted Homepage.dc.html`). No DESIGN.md yet.

## Evidence on Hand

- A working application: real portfolio, schemes, wildlife, weather, and auth
  flows, not mockups.
- Real garden photography supplied by the team (`public/garden-hero-1..3.jpg`)
  and curated bird imagery + copy (`public/birds/`,
  `docs/specs/birds/plotted-garden-birds.md`).
- Feature specs and session handovers under `docs/` and `.claude-notes/`.
- Absences that must not be fabricated: no customer testimonials, no named
  users or case studies, no published user/waitlist numbers, no press, no
  pricing. Plotted is pre-launch.

## Product Principles

1. **Timeliness over completeness.** The product earns a return visit by saying
   something true about *this week* in *this garden*, not by being an exhaustive
   plant database.
2. **The catalogue is the engine, not the destination.** Every plant record
   exists so the companion layer can be specific. Features that enrich records
   are justified by what the companion layer can then do with them.
3. **Quietly clever.** AI does narrow, well-scoped jobs and disappears. If a
   feature makes the software feel present, it is wrong.
4. **Calm by construction.** No scorekeeping, no pressure, no clutter. Bringing
   people back is a content problem (genuine seasonal usefulness), never a
   mechanics problem.
5. **UK-gardener credibility.** Horticultural judgement and UK growing conditions
   are the floor. Generic global-plant-app behaviour reads as a mistake.

## Accessibility & Inclusion

WCAG 2.2 AA is the baseline for all work: AA contrast, complete keyboard paths,
visible focus states, and `prefers-reduced-motion` honoured. Outdoor phone use in
bright light is a real usage scene — contrast and tap-target size have practical
stakes here, not just compliance ones.
