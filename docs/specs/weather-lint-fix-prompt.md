# Claude Code Prompt: Fix `react-hooks/set-state-in-effect` Lint Errors (Weather Feature)

## Context

`npm run lint` is failing on 4 errors, all `react-hooks/set-state-in-effect`, across the weather feature files built in prior stages:

- `components/weather/LocationSearch.tsx:37` — `setResults([])` called synchronously at the top of an effect when `query.length < 2`.
- `components/weather/LocationSearch.tsx:61` — `setHighlightedIndex(-1)` called synchronously in an effect that runs whenever `results` changes.
- `components/weather/WeatherForecast.tsx:56` — `setLoading(true)` (and following `setError(null)`, `setData(null)`) called synchronously at the top of the fetch effect.
- `components/weather/WeatherLocation.tsx:47` — `setLocation(...)` called synchronously in the geolocation-unavailable branch of an effect.

The rule flags calling `setState` directly and unconditionally within an effect body, since this can trigger cascading renders. React's guidance (https://react.dev/learn/you-might-not-need-an-effect) distinguishes two situations, and each of the 4 cases here falls into one of them — treat them differently rather than applying one blanket fix:

1. **State derived from a prop/value change** (`LocationSearch.tsx:61` — resetting highlight index whenever `results` changes) — this should NOT use an effect at all. Use the render-time adjustment pattern from the React docs (store the previous `results` value, e.g. in a ref or via the "adjusting state during render" pattern with a guard comparing against the previous render's value) so the reset happens during render, not in an effect.

2. **Genuine effects reacting to an external system** (`LocationSearch.tsx:37` fetch-guard, `WeatherForecast.tsx:56` fetch-start reset, `WeatherLocation.tsx:47` geolocation branch) — these are legitimately synchronizing with something external (a debounced fetch, the Forecast API, the browser Geolocation API), so keeping them as effects is correct. Fix the specific pattern the rule is flagging: don't call `setState` as an unconditional bare statement at the top of the effect body. Restructure so state updates happen as part of handling the async operation's outcome (e.g. inside the `.then()`/async callback, or gated behind a check that the effect's own async operation is still current — following whatever async-effect race-guard pattern is used elsewhere in the codebase, if one exists) rather than as a synchronous side-effect fired every time the effect re-runs.

## Pre-flight checks

1. Check whether any other effect in the codebase already handles this kind of "reset then fetch" pattern cleanly (e.g. anywhere using an abort controller, a request-id/generation counter, or similar race-guard) and follow that convention if one exists, rather than inventing a new pattern.
2. Confirm the fix for each of the 4 cases individually — do not apply a single mechanical transformation to all 4 without checking it fits that specific case's logic.

## Changes

Fix all 4 lint errors so `npm run lint` passes clean, without changing the observable behaviour of any of the four components:

- Search results still clear when the query drops below 2 characters.
- Highlighted index still resets to -1 whenever a new result set arrives.
- Forecast loading/error/data state still resets correctly when a new fetch starts.
- Geolocation-unavailable fallback still sets the Exeter location and `geoStatus` correctly.

## Do not

- Do not disable or suppress the lint rule (no `eslint-disable` comments).
- Do not change any behaviour, timing, or UX of the location search, highlight navigation, forecast loading states, or geolocation fallback — this is a lint/structure fix only.
- Do not touch files outside these 4.

## Effort estimate

Low–Medium (mechanically small changes, but each needs individual thought per the two categories above).

## Deliverable format

- Updated versions of the 4 files.
- Confirmation `npm run lint` passes with 0 errors.
- Brief note per file on which pattern (render-time adjustment vs. restructured async effect) was applied and why.
