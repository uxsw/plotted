# Claude Code Prompt: Weather Feature — Display UI (Stage 4 of 4)

## Context

Stages 1–3 built the data layer: garden location (saved/geolocated/Exeter fallback), search override, and cached forecast fetching. `WeatherForecast.tsx` currently renders the raw JSON response in a `<pre>` block once location resolves. This final stage replaces that with the actual display UI, styled to match Plotted's design system.

Reference: `docs/specs/weather-feature.md`. Visual reference: Google's weather card layout — current conditions block (temp, condition icon, precipitation/humidity/wind), an hourly temperature strip, and a 5-day forecast row of compact cards.

## Pre-flight checks

Before implementation:

1. Review `lib/weather.ts`'s exported types (`WeatherForecastData`, `WeatherCurrent`, `WeatherHourly`, `WeatherDaily`) to confirm exact shape before building the render.
2. Review Plotted's design tokens (semantic aliases only — e.g. `--color-primary-action`, not primitives like `--clay` directly) and existing component patterns for card-style UI (e.g. how `AiNoticePanel.tsx` or shopping list cards are structured) to match established conventions.
3. Confirm Fraunces/Inter usage conventions — likely Fraunces for the temperature/headline numbers (editorial feel) and Inter for supporting labels, consistent with the rest of the app, but check an existing data-display component to confirm.
4. Check whether the codebase has any existing icon set/convention for weather-like states (sun/cloud/rain), or whether this stage needs to introduce simple icons (e.g. a small SVG set or an icon library already in use elsewhere in the app).

## Changes

Replace the `<pre>` block in `WeatherForecast.tsx` with:

### 1. Current conditions block
- Temperature (large, Fraunces if that matches convention), condition icon, condition label (e.g. "Sunny").
- Secondary row: precipitation chance, humidity, wind — smaller, Inter, muted/secondary text color token.
- Location label displayed here too, with the existing tap-to-change affordance from `LocationSearch.tsx` (Stage 2) surfaced nearby — this stage should visually integrate it rather than leave it as a separate disconnected element.

### 2. Hourly strip
- Horizontally scrollable row (mobile-friendly) showing next ~24h: time, small condition icon, temperature.
- Simple, compact — this doesn't need to be a chart/graph (that's a nice-to-have, not required for this pass).

### 3. Five-day forecast row
- Compact cards: day label (Mon/Tue/etc.), condition icon, high/low temp.
- Today's card visually distinguished (matches the Google reference's highlighted "today" card).

### 4. Loading & error states
- Loading: keep it simple — a lightweight skeleton or muted placeholder matching card dimensions, not a spinner if the codebase has an established loading-state convention elsewhere (check pre-flight step 2 for precedent).
- Error: friendly inline message, no technical detail exposed, with a way to retry (simple button re-triggering the fetch).

## Do not

- Do not reference design token primitives directly in component styles — semantic aliases only, per the project's enforced convention.
- Do not build the hourly strip as a full interactive chart/graph library integration — a simple scrollable row is sufficient for this pass.
- Do not wire this into the dashboard or any nav — still scoped to `/weather`.
- Do not add analytics/tracking.
- Do not modify `lib/weather.ts`, the API route, or the location resolution logic — this stage is presentational only, working with the data those already provide.

## Effort estimate

Medium — mostly UI construction, no new data logic, but several sub-components (current/hourly/daily/loading/error) to build and style consistently.

## Deliverable format

- Updated `WeatherForecast.tsx` (or split into sub-components if that's cleaner — e.g. `CurrentConditions.tsx`, `HourlyStrip.tsx`, `DailyForecast.tsx` — your call based on what keeps the code readable).
- Brief summary of: which design tokens/patterns were followed, any icon approach used, and how loading/error states were handled.
