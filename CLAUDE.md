@AGENTS.md

## Session handoff notes
When asked to write a handoff/session-summary doc, save it to `.claude-notes/` (gitignored) rather than `docs/` or anywhere else in the tracked repo. These are working notes for session continuity, not project documentation. If a handoff note surfaces a genuinely durable decision or convention worth keeping, add it directly to this file (CLAUDE.md) instead — don't leave it sitting only in a handoff note.

## Inline editable field hover pattern:
Editable values use padding: 6px 8px with margin-left: -8px to give the hover background (rgba(226,234,221,0.6)) visual breathing room without shifting text position. Never apply the background without the compensating padding/margin — it will clip against the text edge.

## PWA / Service Worker

Plotted has a minimal PWA shell: manifest (`app/manifest.ts`), install icons (`public/icons/`), and a hand-rolled service worker (`public/sw.js`, no Workbox).

**Scope is deliberately narrow — online-only app, shell-level PWA:**
- The service worker caches only a small static asset list (icons + `offline.html`), versioned under `plotted-shell-v1`. Old caches are cleared on `activate`.
- Navigation requests are network-first. `offline.html` is served only when the network fetch genuinely fails (no connection) — not as a general offline data experience.
- **No API, Supabase, or dynamic route content is cached.** Do not add caching for API responses or app data to `sw.js` without treating it as a new feature (offline data access), not an extension of the existing shell. Requires its own spec — different architecture, different risk profile (stale garden data, sync conflicts).
- `ServiceWorkerRegister.tsx` registers the SW in production only — never in development, to avoid interfering with hot reload.
- `/offline.html` and `/sw.js` are in the auth middleware's static bypass (`lib/supabase/middleware.ts`) — both must be fetchable without auth cookies (browser fetches `sw.js` directly; the SW fetches `offline.html` during install).

**Cache versioning:** bump the cache name (e.g. `plotted-shell-v2`) if the precached asset list changes, so `activate` clears the old one. Forgetting this risks a stale shell surviving a deploy for installed users.

**Deferred:** iOS custom splash screen (`apple-touch-startup-image`), currently using iOS default. Tracked as a follow-up — see `docs/specs/pwa-support.md`.

## PWA install prompt

Separate from the PWA shell itself (see above) — this is the discoverability layer that prompts users to install Plotted, since neither iOS nor Android surfaces installability natively.

**Detection (`lib/utils/platform.ts`, `lib/hooks/useIsStandalone.ts`):**
- `isIOS`/`isAndroid`/`isMobileInstallable` use UA sniffing deliberately — no reliable feature-detection alternative exists for this. iPadOS 13+ disguises its UA as desktop Safari, so `isIOS` also checks for `Mac` UA + `navigator.maxTouchPoints > 1`. Do not "simplify" this check — it will silently break iPad detection.
- `useIsStandalone` combines `matchMedia('(display-mode: standalone)')` and iOS's `navigator.standalone`.
- There's no reliable API for "installed but not currently running standalone" — we rely entirely on the persisted `pwa_installed_at` flag rather than trying to detect this live.

**Schedule (`lib/utils/pwaPromptSchedule.ts`):**
- Pure function `shouldShowPwaPrompt` — the single decision gate for the whole feature. Fully unit tested; keep it pure (no storage reads inside it) if extended.
- Re-prompt thresholds are `[2, 7, 14, 27]` plants logged, indexed by `pwa_prompt_dismiss_count`. After 4 dismissals, we stop asking permanently. Once `pwa_installed_at` is set (ever), we never prompt again — including if the user later removes it from their home screen.
- `pwa_prompt_dismiss_count` and `pwa_installed_at` live in `user_flags`, same table/pattern as other per-user notice flags (e.g. `lookup_notice_seen_at`).

**Android (`PwaInstallPromptProvider`, root-mounted):**
- Captures `beforeinstallprompt` early and stashes it in a `ref` (not state) since it can fire at any point during any page load, well before the user reaches the trigger card — storing in state would cause a pointless subtree re-render on capture. `canInstall` boolean in state signals availability to consumers.
- `appinstalled` sets `pwa_installed_at`.
- If no event was ever captured by the time the card would render, the card hides itself on Android rather than showing a dead button.
- `beforeinstallprompt` only fires in production (service worker is prod-only) — force-fire via Chrome DevTools → Application → Manifest for local testing.

**iOS (`PwaIosInstallOverlay`):**
- Full-viewport overlay via `createPortal`, not a routed page — no URL change, no history entry, back button is unaffected.
- No true "installed" event exists on iOS. Reaching the final step ("Done") is used as an approximate completion signal and sets `pwa_installed_at` — this is a known imperfect proxy, not a real confirmation.
- Closing the overlay early (via X) does not affect `pwa_prompt_dismiss_count` or `pwa_installed_at` — it's treated as a softer exit than dismissing the trigger card itself.

**Structured for future A/B testing, not yet built:** the trigger card takes a `variant` field (currently hardcoded `"default"`), and scheduling logic is fully decoupled from content/variant selection. No actual experimentation framework exists yet — build that as its own piece when needed, loop in Natalie for the analytics side.

## Garden location: no silent auto-geolocation

`WeatherLocation.tsx` used to attempt browser geolocation on mount and save the result to `garden` with no user confirmation. This was deliberately removed (see `components/weather/WeatherLocation.tsx` history) and should not be reintroduced.

- It raced with `LocationOnboardingSection` on `/dashboard`: the silent auto-save could resolve within a second or two of page load, changing `garden.latitude` from null to set and disappearing the onboarding card before the user had done anything.
- It also wrote a meaningless `"Current location"` label to `garden.location_label`, which quietly violated the same principle that already governs the Exeter fallback in the other direction — only an explicitly confirmed location should ever be written to `garden`.
- Exeter is now the unconditional, display-only default whenever nothing is saved (never written to `garden`). Setting a real location happens only via the existing manual search (`LocationSearch` / `saveGardenLocation`) — a one-time action, since gardens don't move.
- This reverses the original [onboarding-location-mvp.md](docs/location/onboarding-location-mvp.md) spec's non-goal of leaving `WeatherLocation.tsx` untouched. That reversal was deliberate and considered, not an unexplained deviation — noted here for anyone reading the spec later.

## Auth confirmation email (React Email)

The Supabase "Confirm signup" email is authored as a React Email component (`emails/ConfirmationEmail.tsx`) instead of being edited directly in the Supabase Dashboard, so it's source-controlled and testable locally.

- After editing `emails/ConfirmationEmail.tsx`, run `npm run email:build` to render it to static HTML at `supabase/templates/confirmation.html` (via `@react-email/render`, script at `scripts/build-email-templates.tsx`).
- Go template placeholders (`{{ .SiteURL }}`, `{{ .TokenHash }}`) are plain JS string constants in the component, not JSX text — writing them as literal JSX text would make the parser try to evaluate `{{ .Foo }}` as a JS expression. Supabase substitutes these itself at send time; the render step must leave them untouched, which it does (verified in the PR that introduced this).
- Test locally with `supabase start`, which reads `supabase/config.toml`'s `[auth.email.template.confirmation]` (`content_path` pointing at the rendered HTML) and serves the real signup flow through Inbucket.
- **Production is a manual step**: there's no CLI push for hosted Supabase email templates. After building, paste the rendered `supabase/templates/confirmation.html` into the Dashboard's Email Templates page by hand.
- Only the confirmation/signup template is wired up so far. Invite, magic link, and email-change templates still use Supabase's default — `scripts/build-email-templates.tsx` is structured as a list so adding those later is additive, not a rewrite.
- `supabase/config.toml` in this repo is intentionally minimal (just `project_id` + the email template section) — no `supabase init` has been run for this project, so `supabase start` needs the rest of the config (api/db/studio ports, etc.) scaffolded first.

## Species reference enrichment: background frost tolerance lookup

Frost tolerance is not part of the main plant AI lookup (`lib/plant-lookup.ts`) — it lives in its own cache table, `species_reference`, keyed by `match_key` (genus/species/cultivar), populated by `lib/species-reference-enrichment.ts`'s `enrichSpeciesReference`. It runs via Next's `after()` inside `upsertPlant` and `updatePlantField` (`app/actions/plants.ts`), i.e. after the response — including after `redirect()` — not before it. This is deliberate: it keeps the add/edit-plant response fast instead of blocking on an AI call.

**This creates a real race** between the redirected plant detail page's first render and enrichment actually finishing (fixed once, see `frost-tolerance-bug` branch history): `redirect()` and the browser following it happen in milliseconds; `enrichSpeciesReference` does a DB check, an `INSERT` of a `pending` row, an Anthropic API call, then an `UPDATE` — easily 1–3+ seconds for a genuinely new species. The first page load routinely beats it.

**First fix attempt (superseded — kept here as a documented dead end, don't retry it):** each of the three `enrichSpeciesReference` call sites in `app/actions/plants.ts` calls `revalidatePath` for that specific plant's detail path *inside* the same `after()` callback, once enrichment resolves rather than alongside the surrounding write. This was believed to push a live update to a client already sitting on the detail page, based on `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md`: *"Server Functions: Updates the UI immediately (if viewing the affected path)."* **Real-world testing showed this doesn't happen** — the page still only updated on manual reload, every time, across repeated tests.

**Why it doesn't work:** that "immediate update" behaviour rides on the invoking Server Function's own HTTP response — it's how the response tells the client "here's fresh RSC data for the path you're on." `after()` is defined (`after.md`) as running *"after a response... is finished"* — by the time `enrichSpeciesReference` resolves (its Anthropic call alone is typically 1–3+ seconds), the `upsertPlant` action's response has long since been sent and the connection is closed. There's no live response left for `revalidatePath` to attach an update to. This is a structural mismatch between the two APIs' contracts, not a misconfiguration — calling `revalidatePath` from inside `after()` still has value (see below) but will never live-update an open tab, on this Next.js version or any other, because the mechanism it would need doesn't exist post-response.

**What revalidatePath inside after() is actually for:** cache hygiene for the *next* navigation only — e.g. clicking back into this plant from the list later doesn't serve a stale prefetched payload. Keep these calls; just don't expect them to solve the live-update problem.

**Actual fix — client-side polling (`components/PlantDetail.tsx`):** while the "Looking up frost tolerance…" state is showing (`frostLookingUp` true), a `useEffect` polls every 5 seconds via `router.refresh()` — a genuinely new client-initiated request per `next/navigation`'s `useRouter` docs ("Making a new request to the server, re-fetching data requests, and re-rendering Server Components... merges the updated React Server Component payload without losing unaffected client-side state"). The poll stops itself the moment `frostLookingUp` goes false, whether because `species_reference` resolved or because the plant aged out of the recency window — no separate stop condition needed, since both are already folded into that one flag.

**UI-side bound:** the "Looking up frost tolerance…" affordance covers two states — no `species_reference` row yet, or a `pending` one — and is shown only while the plant is younger than `PENDING_STALE_MS` (`lib/species-reference-timing.ts`, shared with the enrichment job's own stale-pending threshold so the UI never spins past the point the server itself would consider the lookup abandoned). Past that window, `pending`/no-row renders nothing, same as `failed` or a genuine null result — this is intentional, not a bug: it stops a stuck or never-triggered lookup from spinning forever on an old plant, and it's also what stops the poll from running indefinitely. `species-reference-timing.ts` has no server-only imports specifically so `PlantDetail.tsx` (a client component) can import the shared constant without pulling `species-reference-enrichment.ts`'s Anthropic SDK / service-role Supabase client into the client bundle — keep it that way.

**If you're tempted to try server-push again** (revalidateTag, a websocket, SSE, etc.) — fine, but verify it end-to-end with a real open tab and a real background completion before trusting it; this exact "it's documented, it must work" assumption is what shipped the previous broken fix.
