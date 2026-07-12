# Claude Code Prompt: Weather Feature — Forecast Fetch & Caching (Stage 3 of 4)

## Context

Stage 1 added the `garden` table with location columns. Stage 2 added location resolution (`WeatherLocation.tsx`, `garden.ts` server action) and search (`LocationSearch.tsx`), mounted at `app/(app)/weather/page.tsx`. This is Stage 3 of 4: fetching and caching the actual forecast data from Open-Meteo, given a resolved lat/lng. The display UI (rendering current/hourly/daily data nicely) is Stage 4 — do not build the final presentational layer here, though a minimal unstyled render of the raw data is fine for verifying the fetch works end-to-end.

Reference: `docs/specs/weather-feature.md`.

## Pre-flight checks

Before implementation:

1. Look at how caching/revalidation is handled elsewhere in the codebase (e.g. any existing `fetch` calls with Next.js `revalidate` options, or route segment config) and follow the same approach rather than introducing a new caching pattern.
2. Confirm how `WeatherLocation.tsx` currently exposes the resolved lat/lng (props, context, callback) so the forecast fetch can be wired to it without restructuring Stage 2's component.
3. Check Open-Meteo's forecast API docs for the exact parameters needed: current conditions, hourly (next ~24h), and daily (5-day) blocks, plus the units Plotted should request (confirm metric — Celsius, mph or km/h wind — matches the rest of the app's conventions, if any exist).

## Changes

### 1. Forecast fetch

- Server-side fetch to Open-Meteo's forecast endpoint (`https://api.open-meteo.com/v1/forecast`), given a lat/lng.
- Request current conditions, hourly temperature/precipitation for the next ~24h, and daily min/max/precipitation/condition for 5 days.
- No API key needed.

### 2. Caching

- Use time-based revalidation (1–3 hours) via whichever Next.js caching mechanism matches the codebase's existing pattern (fetch-level `revalidate`, route segment `revalidate`, or `unstable_cache` — follow pre-flight step 1's finding).
- Cache key should be scoped by coordinates (rounded appropriately, e.g. to 2 decimal places, so minor coordinate jitter doesn't bust the cache unnecessarily) so different gardens' forecasts don't collide or overwrite each other.

### 3. Wiring into `/weather`

- Once `WeatherLocation.tsx` has resolved a lat/lng (saved, geolocated, or fallback), trigger the forecast fetch for those coordinates.
- Render the raw returned data minimally on the page (plain text/JSON is fine) so the fetch, caching, and location-resolution handoff can all be verified working end-to-end. Stage 4 will replace this with the real UI.

## Do not

- Do not build the styled UI (current/hourly/daily cards, icons, the Google-reference layout) — that's Stage 4.
- Do not build the dashboard or link this into nav.
- Do not add analytics/tracking.
- Do not introduce a new caching approach if an existing pattern already exists in the codebase — follow it.
- Do not fetch weather for coordinates before location resolution has completed (i.e. don't fire a fetch with stale/default coordinates and then re-fetch — wait for `WeatherLocation.tsx`'s resolved value).

## Effort estimate

Low.

## Deliverable format

- Forecast fetch function/route, with caching applied.
- Minimal wiring into `/weather` page showing raw fetched data.
- Brief summary of: which caching mechanism was used and why, the exact revalidation window chosen, and confirmation the fetch only fires once location is resolved (not before).
