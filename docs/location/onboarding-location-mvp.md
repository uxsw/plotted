# Onboarding Location Capture

**Status:** Draft for review
**Depends on:** Existing `garden` table (`user_id`, `latitude`, `longitude`, `location_label`), existing `saveGardenLocation` action, existing `LocationSearch` component
**Unblocks:** Dashboard weather/frost-tolerance card, species-reference frost tolerance feature (both need a reliably-known user location without requiring a prior visit to `/weather`)

---

## Problem

Location is currently only captured reactively, on first visit to `/weather` — either via browser geolocation or manual search, both writing to `garden` via `saveGardenLocation`. This works fine for the weather page itself, but a dashboard that needs to proactively show weather- or frost-dependent content can't rely on a user having visited `/weather` first. A user who never does so has `garden.latitude/longitude = null` indefinitely, with no prompt to resolve it.

Separately, the current `LocationSearch` component appears to use a global place-name geocoder, which under-resolves smaller UK settlements (e.g. "Woodbury" isn't found; the user has to select "Exeter," a nearby town, instead) — imprecise for a UK-focused, garden-specific audience.

## Goals

1. Capture a real, confirmed location once, early (onboarding), so `garden` is populated for the large majority of users without relying on the weather page.
2. Keep this low-friction — one field, clear purpose, skippable.
3. Make location editable afterwards, discoverable but not prominent.
4. Replace the primary UK lookup mechanism with UK postcode lookup, precise enough for small villages, falling back to the existing global search for non-UK users.

## Non-goals

- Garden size, aspect, soil type, or any other onboarding field. Explicitly deferred — no current feature depends on them, and bundling them in here undermines the low-friction goal. Tracked separately as a future onboarding-fields issue.
- Rebuilding the weather page's existing location UI/logic. `WeatherLocation.tsx`'s current behaviour (geolocation attempt, Exeter fallback, manual change) stays as-is; this spec adds a new entry point and a better search backend, not a rewrite of the weather component.
- A mandatory location gate. Onboarding location capture is skippable, consistent with not wanting to block users at the very first screen of a beta product.

---

## Onboarding flow

- A single step, likely immediately after account creation, before or alongside first dashboard load.
- One input (location search, described below), one short explanatory line: something like "So we can show accurate weather and planting advice for your area."
- A visible, low-friction skip option — e.g. "Skip for now, use Exeter as default" — mirroring today's existing fallback behaviour rather than introducing a new failure state. Skipping leaves `garden.latitude/longitude` as `null`, identical to today's un-visited-weather-page state — no new logic needed to handle this elsewhere.
- On successful selection, calls the existing `saveGardenLocation` action — same function the weather page already uses, so there is one single code path for "set a user's location," not two parallel ones.
- Gate: a boolean flag (`onboarding_location_seen_at` or similar timestamp, following the existing `lookup_notice_seen_at` naming pattern) determines whether this step has been shown. Natural home is `user_flags`, alongside `ai_lookup_enabled` and the PWA flags already stored there.

## Editing after onboarding

- Lives in account/profile settings as a plain "Location" row showing the current `location_label`, with an "Edit" affordance — not a banner, not a dashboard prompt, consistent with your instinct that this rarely needs revisiting.
- Reuses the same location-search component as onboarding — one component, two entry points (onboarding step, settings row).
- No change needed to the weather page's own "Location access denied — showing Exeter, use Change to set your location" prompt; that already exists and already serves as a contextual nudge for exactly the users who skipped onboarding or denied geolocation.

## Downstream consumers must distinguish "known" from "Exeter fallback"

Any feature reading `garden` for location (dashboard weather/frost card, in particular) must treat `garden.latitude/longitude = null` as genuinely unknown, and must not treat a `location_label` of "Exeter, Devon, United Kingdom" as confirmed unless it was actually explicitly chosen — the existing weather component already avoids saving the Exeter fallback to `garden`, so this distinction is preserved by construction as long as new consumers only read from `garden` rather than re-deriving location some other way.

---

## Location search backend: UK postcode-first

**Problem with current approach:** the existing search appears to hit a global place-name geocoder, which resolves large towns well but misses smaller UK villages, forcing users to pick an approximate nearby town instead of their actual location.

**Proposed approach:** make UK postcode lookup the primary path, since it's more precise and arguably more natural for a UK gardening audience — people know their postcode, and it resolves to garden-level precision rather than nearest-town precision.

- **Service:** [postcodes.io](https://postcodes.io) — free, open-source, no API key required, no rate-limit/auth overhead (consistent with the keyless Open-Meteo integration already in use).
- **Endpoint:** `GET api.postcodes.io/postcodes/{postcode}` — returns `latitude`, `longitude`, `admin_district`, `parish` directly from a postcode, no separate geocoding step needed.
- **Label generation:** rather than storing the raw postcode as `location_label`, compose a friendlier label from the response, e.g. `"{parish or admin_district}, {admin_district}"` → "Woodbury, East Devon" instead of "EX5 1AB". Needs a little care where `parish` is blank (common in urban areas) — fall back to `admin_district` alone in that case.
- **Input handling:** detect UK postcode-shaped input first (UK postcodes have a distinctive, checkable format) and try postcodes.io. If the input doesn't look like a postcode, or the lookup 404s, fall back to the existing global place-name search — this covers non-UK users and anyone typing a town name out of habit, without breaking their experience.
- **Optional enhancement:** postcodes.io also exposes an autocomplete endpoint, which could make the input feel more responsive (suggestions as you type) — worth considering for polish, not required for a first pass.
- **Note:** postcodes.io provides UK coverage only (Great Britain, Northern Ireland, Channel Islands, Isle of Man data). Non-UK users still need the existing global search as the fallback path — this isn't a full replacement, just the UK-first branch.

---

## Effort estimate

| Piece | Effort |
|---|---|
| Onboarding step UI + copy + skip handling | Low |
| `user_flags` addition (onboarding-seen timestamp) | Low |
| Settings page location row + edit entry point | Low |
| Postcode-first search: detection, postcodes.io call, label composition, fallback to existing global search | Medium |
| Autocomplete polish (optional) | Low, deferred if not needed for v1 |

## Deferred / out of scope (tracked separately)

- Garden size, aspect, soil type, and any other onboarding fields
- Postcode autocomplete-as-you-type (nice-to-have, not required)
- Any change to the weather page's existing geolocation/fallback logic
