# Weather Feature (Phase 1: Forecast Display)

## Context

Long-term goal: build dynamic, time-sensitive, personalised content that brings users back to Plotted regularly. Weather is the first step toward this — on its own it has limited standalone value, but it opens the door to future features (weather-based job suggestions, and eventual inclusion in a richer home dashboard alongside recently planted, shopping list, planting schemes, etc.).

This spec covers **Phase 1 only**: fetching and displaying a garden's weather forecast. It is being built as a self-contained, unmounted component — not linked in navigation, not integrated into the dashboard (which doesn't exist yet), and with no job-suggestion logic. It's a low-risk, low-priority build relative to beta launch — suitable for picking up between higher-priority work.

Reference UI: Google's weather card (current conditions, hourly temperature strip, 5-day forecast), including its location-switching pattern (persistent chosen location, easy to change).

### Why Open-Meteo

- No API key required — no credential management, no risk of a missing-env-var incident like the `SUPABASE_SERVICE_ROLE_KEY` issue previously hit in production.
- Free tier: up to 10,000 calls/day, sufficient for beta scale.
- Provides current conditions, hourly, and daily forecast in one response.
- Also provides a free, keyless Geocoding API — used for the text-search location fallback, avoiding a second provider/dependency.
- **Constraint to note:** Open-Meteo's free tier is non-commercial use only. Fine through beta; must be revisited (paid tier, or provider switch) once Plotted monetises. Flagging this now so it isn't forgotten later — not a blocker for this build.

## Pre-flight checks

Before implementation, confirm:

1. **Garden table schema** — exact current column names/types on the garden table, so new location columns follow existing naming and type conventions.
2. **Existing garden creation/edit flow** — confirm there's a sensible point to eventually surface location editing (not built in this phase, but migration should anticipate it).
3. **Local dev HTTPS behaviour** — confirm `navigator.geolocation` behaves as expected on `localhost` in the dev environment (Chrome generally treats `localhost` as a secure context, but worth a quick manual check before relying on it).

## Changes

### 1. Database migration

Add three nullable columns to the garden table:
- `latitude` (numeric)
- `longitude` (numeric)
- `location_label` (text) — human-readable name for display (e.g. "Exeter"), returned by the geocoding search or reverse-derived from coordinates where possible.

Location lives on the **garden** record, not the user record. Plotted is single-garden-per-user today, but this keeps the data model correct for if/when multi-garden support is added later — no rework needed at that point.

No backfill needed — existing gardens will have `NULL` location until a user sets one (handled via the fallback below).

### 2. Location resolution logic

On loading the weather component, resolve location in this order:

1. **Saved location** — if the garden record has `latitude`/`longitude`, use it.
2. **Browser geolocation** — if no saved location, prompt via `navigator.geolocation.getCurrentPosition`. If granted, use the result and save it to the garden record.
3. **Default fallback** — if geolocation is denied, unavailable, or errors, default to **Exeter** (hardcoded coordinates). Do not attempt IP-based geolocation or any other guessing — adds a dependency for marginal benefit at this scale.

At all times, the resolved location should be user-editable via a text search (see below), regardless of which path set it.

### 3. Location search (text fallback / manual override)

- Single search input, calling Open-Meteo's Geocoding API.
- Return a simple dropdown of matches (place name + admin area, e.g. "Exeter, Devon, UK") — not Google's categorised "For you / Popular" UI, which relies on usage data Plotted doesn't have.
- Selecting a result saves `latitude`, `longitude`, `location_label` to the garden record and refetches weather.

### 4. Weather data fetch

- Server-side fetch (API route or server component) to Open-Meteo's forecast endpoint using the garden's resolved coordinates.
- Cache with time-based revalidation (1–3hr) to stay well within rate limits as garden count grows. Exact revalidation window to be decided at implementation time based on Next.js caching approach used elsewhere in the app.
- Request: current conditions, hourly (next ~24h), daily (5-day) blocks.

### 5. UI component

- Mirrors the Google reference: current temp/condition icon/precip/humidity/wind at top, hourly temperature strip, 5-day forecast row.
- Location label shown with an affordance to change it (opens the search input).
- Component built to be mountable later inside a dashboard — avoid hard dependencies on being a full-page view.

### 6. Temporary route

- Mount the component at `/weather`.
- Not linked from any nav or in-app UI.
- No auth-gating beyond whatever the route naturally inherits — treat as an internal/dev-facing route for now.

## Do not

- Do not build job-suggestion logic ("good day to water", frost warnings, etc.) — explicitly Phase 2, out of scope here.
- Do not build or wire up the home dashboard — this component is being built to be *mountable* there later, not integrated now.
- Do not add Google Analytics or any custom event tracking (e.g. fallback-shown events) — deferred to Natalie.
- Do not attempt IP-based or other automatic location guessing beyond browser geolocation.
- Do not build multi-garden location support — single garden per user remains the model.
- Do not use Google Places or any geocoding provider other than Open-Meteo.

## Effort estimate

**Low–Medium.**

- Migration: Low (3 nullable columns)
- Geolocation + text search + save flow: Medium (most of the complexity here)
- Forecast fetch + caching: Low (well-trodden pattern, similar to existing polling/fetch code)
- UI component: Low–Medium depending on fidelity to the Google reference

## Deliverable format

Implementation to follow the usual staged approach: migration first (reviewable on its own), then location resolution + search, then fetch/cache, then UI — each as a discrete diff for review rather than one large change.
