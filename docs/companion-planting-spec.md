# Companion Planting — Feature Spec

**Status:** Ready for implementation  
**Feature area:** New — Planting Schemes  
**Estimated complexity:** High (new nav, new data model, AI prompt, Wikimedia integration, new UI patterns)

---

## Overview

Companion planting is a new top-level feature in Plotted that lets users select plants from their library and receive AI-generated planting recommendations. Results are presented as an editorial long-form page with embedded plant suggestion cards. Users can save recommendations as named planting schemes for future reference.

---

## Data model

### `schemes` table

```sql
create table schemes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  space text not null check (space in ('small', 'medium', 'large')),
  successional boolean not null default true,
  edible boolean not null default false,
  narrative_intro text not null,
  narrative_body text not null,
  featured_plant_latin text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### `scheme_source_plants` table

Plants the user selected from their library to generate the scheme.

```sql
create table scheme_source_plants (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid references schemes(id) on delete cascade not null,
  plant_id uuid references plants(id) on delete set null,
  sort_order integer not null default 0
);
```

### `scheme_suggestions` table

AI-generated plant suggestions attached to a scheme.

```sql
create table scheme_suggestions (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid references schemes(id) on delete cascade not null,
  common_name text not null,
  latin_name text not null,
  tier text not null check (tier in ('back', 'mid', 'ground')),
  height_cm integer,
  flowering_months integer[],
  why text not null,
  wildlife_value boolean not null default false,
  drought_tolerant boolean not null default false,
  edible boolean not null default false,
  british_native boolean not null default false,
  saved boolean not null default true,
  sort_order integer not null default 0
);
```

> **Note:** `saved` defaults to true — all suggestions are saved when the scheme is created. Users can dismiss individual suggestions (sets `saved = false`) after viewing. Do not hard-delete dismissed suggestions.

---

## Navigation

Introduce a simple global nav bar. Two items only for now:

- **My plants** — links to `/plants` (existing plant list)
- **Planting schemes** — links to `/schemes` (new)

Implementation detail deferred to Claude Code, but the nav should use existing design tokens and sit consistently across both sections. Mobile-first.

---

## User journey

### 1. Schemes landing page — `/schemes`

- Lists the user's saved schemes, most recent first
- Each scheme shown as a card: name, date created, number of suggestions, source plant thumbnails
- Primary CTA: **Create new scheme**
- Empty state: friendly prompt to create their first scheme

### 2. Plant selection — `/schemes/new`

Step 1 of 2.

- Horizontally scrolling list of the user's plants, iOS photo-picker style
- Each plant shown as a thumbnail (hero image if available, botanical illustration fallback)
- Tap to select — selected state: checkmark overlay + ring
- Maximum 5 plants selectable
- Persistent bottom CTA showing selection count: "Continue with 3 plants →" (disabled until at least 1 selected)

### 3. Preferences — `/schemes/new` (step 2)

Step 2 of 2, below or after plant selection on the same page.

- **Space available** — three options presented as selectable tiles:
  - Small — up to 2m²
  - Medium — 2–6m²
  - Large — 6m²+
- **Successional planting** toggle — on by default, label: "Fill gaps in flowering season"
- **Edible plants** toggle — off by default, label: "Include edible and kitchen garden plants"
- CTA: **Generate scheme**

> Wildlife friendly and drought tolerant are NOT presented to the user. They are baked into the AI prompt as default weighting.

### 4. Generation — loading state

- Full-page loading state while the AI call completes
- Botanical illustration or animated element — keep on-brand
- Estimated wait: 5–10 seconds

### 5. Scheme results page — `/schemes/[id]`

Editorial layout, mobile-first:

```
[Scheme name — auto-generated default, editable inline]
[narrative_intro]
[Hero image — Wikimedia image of first source plant or most iconic of the selected plants]
[narrative_body]
[Featured plant image — Wikimedia image of featured_plant latin name, if available]
[Suggestion cards — grouped by tier]
  Back of border
    [card] [card]
  Mid border
    [card] [card]
  Ground cover
    [card] [card]
```

**Suggestion card anatomy:**
- Plant photo (Wikimedia, lazy-loaded)
- Common name (prominent)
- Latin name (italic, muted)
- `why` text
- Height + flowering months
- Badges: Wildlife friendly / Drought tolerant / Edible / British native
- Dismiss button (×) — sets `saved = false`, removes card from view with animation

**Auto-generated scheme name:** format `[Season] [dominant characteristic] · [Month Year]` — e.g. "Summer pollinator border · June 2026". Claude Code can generate this from the narrative or use a simple date-based fallback.

---

## AI prompt

### Pre-flight enrichment

Before building the main prompt, check each selected plant for `flowering_months`. If null or empty for any plant, fire a targeted Anthropic API call to retrieve it — same pattern as existing plant lookup, scoped to that field only. Run all enrichment calls in parallel.

### Prompt

```
You are an expert horticultural adviser writing personalised planting recommendations for a gardening app called Plotted. Your tone is warm, authoritative and educational — like a knowledgeable garden columnist writing for an informed but non-expert audience. Avoid jargon. Never use the word "tapestry". Prefer the most common, friendly version of a plant's common name.

The user has selected these plants from their garden:
{plants}

Context inferred from their selection:
- Average height: ~{avg_height}cm
- Light conditions: {sun_needs}
- Current flowering coverage: {covered_months}
- Flowering gaps: {gap_months}
- Available space: {space}
- Successional planting: {successional}

Preferences:
- weight suggestions toward plants with strong wildlife and pollinator value
- weight suggestions toward drought-tolerant plants where possible
{edible_instruction}

Return a JSON object with exactly this structure:
{
  "narrative_intro": "A single opening paragraph. Characterise the existing planting warmly and identify the main opportunity or challenge the suggestions will address. This paragraph appears before the first image in the app, so it should work as a compelling standalone hook.",
  "narrative_body": "Two paragraphs. Explain the strategy behind the suggestions and what the additions achieve together. Where natural, reference one of the suggested plants by name to create a bridge to the suggestion cards below.",
  "featured_plant": "The latin name of whichever suggested plant you consider most visually striking or characterful — used to source a pull image for the narrative body.",
  "suggestions": [
    {
      "common_name": "string — use the most widely recognised, user-friendly common name",
      "latin_name": "string — accurate binomial, suitable for Wikimedia Commons image lookup",
      "tier": "back | mid | ground",
      "height_cm": number,
      "flowering_months": [array of month numbers 1-12],
      "why": "1-2 sentences explaining why this plant works specifically with the existing selection — reference the existing plants where relevant, not just the plant's general qualities",
      "wildlife_value": true | false,
      "drought_tolerant": true | false,
      "edible": true | false,
      "british_native": true | false
    }
  ]
}

Return {suggestion_count} suggestions appropriate to the space size. Ensure at least 2 ground cover suggestions. Categorise each into tier: back (tall, structural, 80cm+), mid (border plants, 40-80cm), ground (low-growing, spreading, under 40cm). Return ONLY valid JSON, no markdown, no preamble.
```

### Template variable notes

| Variable | Source |
|---|---|
| `{plants}` | Selected plants formatted as bulleted list with all available fields |
| `{avg_height}` | Mean of `height_cm` across selected plants |
| `{sun_needs}` | Deduplicated list of `sun` values |
| `{covered_months}` | Union of all `flowering_months` arrays, formatted as month names |
| `{gap_months}` | Months 1–12 not present in `covered_months` |
| `{space}` | User selection: "small (up to 2m²)" / "medium (2–6m²)" / "large (6m²+)" |
| `{successional}` | "yes — suggest plants that fill identified flowering gaps" or "not a priority" |
| `{edible_instruction}` | If edible toggle on: "- prioritise edible or dual-purpose plants (fruit, vegetables, herbs)" — else omit |
| `{suggestion_count}` | small: 4–5 / medium: 5–7 / large: 6–8 |

---

## Wikimedia image fetching

Use the Wikimedia REST API to fetch a representative image for each suggestion card, the hero image, and the featured plant pull image.

**Endpoint:**
```
https://en.wikipedia.org/api/rest_v1/page/summary/{latin_name_url_encoded}
```

The `thumbnail.source` field in the response gives a usable image URL. Request the thumbnail variant, not the full resolution original.

**Implementation notes:**
- Fetch all suggestion images in parallel after the AI response is received, before saving to the database
- Store the image URL in `scheme_suggestions` (add `wikimedia_image_url text` column)
- Some lookups will return no image — handle gracefully with a botanical illustration fallback
- Attribution is required by Wikimedia licence. Store `wikimedia_attribution text` (photographer/licence string from the API response) alongside the image URL and display it beneath each image in small muted text

**Attribution field in response:** `thumbnail` does not include attribution directly — fetch `originalimage` or use the `content_urls.desktop.page` link and display "Image: Wikimedia Commons" with a link as a safe fallback if attribution metadata is unavailable.

---

## API routes

### `POST /api/schemes/generate`

Accepts:
```json
{
  "plant_ids": ["uuid", "uuid"],
  "space": "small | medium | large",
  "successional": true,
  "edible": false
}
```

Steps:
1. Fetch full plant records for each `plant_id`
2. Run pre-flight enrichment for any plants missing `flowering_months` (parallel)
3. Build and execute AI prompt
4. Parse JSON response
5. Fetch Wikimedia images in parallel for all suggestions + featured plant
6. Save scheme + source plants + suggestions to database
7. Return scheme ID

Returns:
```json
{ "scheme_id": "uuid" }
```

Client redirects to `/schemes/[id]`.

### `GET /api/schemes`

Returns list of user's schemes for the landing page.

### `GET /api/schemes/[id]`

Returns full scheme with source plants and suggestions.

### `PATCH /api/schemes/[id]`

Update scheme name.

### `PATCH /api/schemes/[id]/suggestions/[suggestionId]`

Update `saved` field (dismiss a suggestion).

---

## Implementation order for Claude Code

Deliver in this sequence to allow review between stages:

1. **Database** — create tables, RLS policies, run migration
2. **API routes** — generate, list, get, patch (name + dismiss)
3. **Navigation** — global nav bar, routing
4. **Schemes landing page** — list + empty state
5. **Plant selection + preferences UI** — `/schemes/new`
6. **Generation loading state**
7. **Scheme results page** — editorial layout, suggestion cards, badges, dismiss

---

## Deferred (do not build now)

- Editing a scheme after generation (adding/removing plants manually)
- Sharing a scheme with another user
- Regenerating a scheme with different preferences
- Bed/zone assignment for schemes
- Exporting a scheme as PDF or shopping list

---

## Do not touch

- Existing plant list, plant detail page, or any existing components
- Supabase auth flow
- Marketing pages
