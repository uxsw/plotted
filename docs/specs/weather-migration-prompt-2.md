# Claude Code Prompt: Weather Feature — Location Resolution & Search (Stage 2 of 4)

## Context

Stage 1 added the `garden` table with `latitude`, `longitude`, `location_label` columns (migration `020_garden.sql`). This is Stage 2 of 4: resolving a garden's location (saved → browser geolocation → Exeter fallback) and providing a manual text-search override. The weather fetch/cache logic and the display UI are separate later stages — do not build them here.

Reference: `docs/specs/weather-feature.md`.

Since this is new ground (no existing garden-fetching code to follow conventions from — the `garden` table was only just created in Stage 1), use your judgement on idiomatic Next.js App Router / Supabase patterns consistent with the rest of the codebase, and flag any non-obvious decisions in your summary rather than assuming.

## Pre-flight checks

Before implementation:

1. Confirm there is a reliable way to get the current user's `garden` row server-side (likely via `user_id` — confirm the garden table has no unique constraint issue fetching a single row per user, per Stage 1's design note).
2. Check how existing server-side Supabase calls are structured in this codebase (e.g. how `createServiceClient` or the standard server client is used elsewhere) and follow the same pattern rather than introducing a new one.
3. Confirm there's no existing geolocation or location-search utility anywhere in the codebase already (e.g. from an earlier abandoned feature) before building fresh.

## Changes

### 1. Location resolution logic

On the (temporary) `/weather` route, resolve the garden's location in this order:

1. **Saved location** — if the garden row has non-null `latitude`/`longitude`, use it directly. No geolocation prompt needed.
2. **Browser geolocation** — if no saved location, prompt via `navigator.geolocation.getCurrentPosition` (client-side). If granted, use the result to update the garden row's `latitude`, `longitude`, and `location_label` (reverse-geocode the coordinates via Open-Meteo's geocoding API to get a human-readable label — see below for the geocoding call shape).
3. **Fallback** — if geolocation is denied, errors, or unavailable (e.g. `navigator.geolocation` undefined), default to Exeter using hardcoded coordinates (do not call any geocoding service for this — just hardcode Exeter's lat/lng and label directly as constants). Do not save this fallback to the garden row — it should only be treated as "the current default view," not persisted, so that geolocation or search can still take over on a later visit.

### 2. Location search (manual override)

- A simple search input component: as the user types, query Open-Meteo's Geocoding API (`https://geocoding-api.open-meteo.com/v1/search?name={query}`) and show a dropdown of results (place name + admin area + country, e.g. "Exeter, Devon, United Kingdom").
- Debounce input to avoid firing a request per keystroke.
- Selecting a result updates the garden row's `latitude`, `longitude`, `location_label` and should trigger a refresh of whatever is currently resolving/displaying location (a simple client-side state update / router refresh is fine — no need to over-engineer this since the weather display itself isn't built yet).
- No API key needed for Open-Meteo geocoding.

### 3. Server actions / API route

- Add a server action or API route to update the garden's location columns (used by both the geolocation-save flow and the search-select flow). Follow whatever pattern (server action vs API route) is more consistent with how similar single-record updates are done elsewhere in the codebase.

## Do not

- Do not build the weather forecast fetch or any display of actual forecast data — this stage is location only.
- Do not build the dashboard or wire this into any existing nav/page — everything here stays scoped to the `/weather` route.
- Do not persist the Exeter fallback location to the garden row.
- Do not add any analytics/tracking events.
- Do not use Google Places or any geocoding provider other than Open-Meteo.
- Do not build multi-garden handling — assume one garden per user, per the existing schema design.

## Effort estimate

Medium.

## Deliverable format

- Location resolution logic (likely a server component/hook combination) for the `/weather` route.
- Search component with debounced Open-Meteo geocoding lookup and result dropdown.
- Server action/API route for saving location updates.
- Brief summary of: where each piece lives, which pattern was followed for the server update (and why), and any assumptions made given the lack of prior art to follow.
