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

Frost tolerance is not part of the main plant AI lookup (`lib/plant-lookup.ts`) — it lives in its own cache table, `species_reference`, keyed by `match_key` (genus/species/cultivar), populated by `lib/species-reference-enrichment.ts`'s `enrichSpeciesReference`. It runs via Next's `after()` from four places: plant creation (`createPlantWithLookup`, `lib/plant-create.ts`), `upsertPlant`'s update branch and `updatePlantField` (`app/actions/plants.ts`), and the retry route (`app/api/plants/[id]/lookup/route.ts`), i.e. after the response — including after `redirect()` — not before it. This is deliberate: it keeps the add/edit-plant response fast instead of blocking on an AI call.

**This creates a real race** between the redirected plant detail page's first render and enrichment actually finishing (fixed once, see `frost-tolerance-bug` branch history): `redirect()` and the browser following it happen in milliseconds; `enrichSpeciesReference` does a DB check, an `INSERT` of a `pending` row, an Anthropic API call, then an `UPDATE` — easily 1–3+ seconds for a genuinely new species. The first page load routinely beats it.

**First fix attempt (superseded — kept here as a documented dead end, don't retry it):** each of the three `enrichSpeciesReference` call sites in `app/actions/plants.ts` calls `revalidatePath` for that specific plant's detail path *inside* the same `after()` callback, once enrichment resolves rather than alongside the surrounding write. This was believed to push a live update to a client already sitting on the detail page, based on `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md`: *"Server Functions: Updates the UI immediately (if viewing the affected path)."* **Real-world testing showed this doesn't happen** — the page still only updated on manual reload, every time, across repeated tests.

**Why it doesn't work:** that "immediate update" behaviour rides on the invoking Server Function's own HTTP response — it's how the response tells the client "here's fresh RSC data for the path you're on." `after()` is defined (`after.md`) as running *"after a response... is finished"* — by the time `enrichSpeciesReference` resolves (its Anthropic call alone is typically 1–3+ seconds), the `upsertPlant` action's response has long since been sent and the connection is closed. There's no live response left for `revalidatePath` to attach an update to. This is a structural mismatch between the two APIs' contracts, not a misconfiguration — calling `revalidatePath` from inside `after()` still has value (see below) but will never live-update an open tab, on this Next.js version or any other, because the mechanism it would need doesn't exist post-response.

**What revalidatePath inside after() is actually for:** cache hygiene for the *next* navigation only — e.g. clicking back into this plant from the list later doesn't serve a stale prefetched payload. Keep these calls; just don't expect them to solve the live-update problem.

**Actual fix — client-side polling (`components/PlantDetail.tsx`):** while the "Looking up frost tolerance…" state is showing (`frostLookingUp` true), a `useEffect` polls every 5 seconds via `router.refresh()` — a genuinely new client-initiated request per `next/navigation`'s `useRouter` docs ("Making a new request to the server, re-fetching data requests, and re-rendering Server Components... merges the updated React Server Component payload without losing unaffected client-side state"). The poll stops itself the moment `frostLookingUp` goes false, whether because `species_reference` resolved or because the plant aged out of the recency window — no separate stop condition needed, since both are already folded into that one flag.

**UI-side bound:** the "Looking up frost tolerance…" affordance (`isFrostLookupPending`) covers two states — no `species_reference` row yet, or a `pending` one — and is shown only for a plant that has a genus (without one nothing is ever enriched, see the genus guard below) and only while the plant is younger than `PENDING_STALE_MS` (`lib/species-reference-timing.ts`, shared with the enrichment job's own stale-pending threshold so the UI never spins past the point the server itself would consider the lookup abandoned). Past that window, `pending`/no-row renders nothing, same as `failed` or a genuine null result — this is intentional, not a bug: it stops a stuck or never-triggered lookup from spinning forever on an old plant, and it's also what stops the poll from running indefinitely. `species-reference-timing.ts` has no server-only imports specifically so `PlantDetail.tsx` (a client component) can import the shared constant without pulling `species-reference-enrichment.ts`'s Anthropic SDK / service-role Supabase client into the client bundle — keep it that way.

**If you're tempted to try server-push again** (revalidateTag, a websocket, SSE, etc.) — fine, but verify it end-to-end with a real open tab and a real background completion before trusting it; this exact "it's documented, it must work" assumption is what shipped the previous broken fix.

## Genus resolution and the genus guard

`species_reference.match_key` is genus-first, so a blank genus makes keys of the wrong shape (`|apple`, `|officinalis`) that unrelated plants can share. Two rules keep them out. Issue history: uxsw/plotted#97 and #98.

- **The genus guard (`hasGenusForEnrichment`, `lib/lookup-apply.ts`).** Every path that calls `enrichSpeciesReference` checks it first: no genus, no enrichment, no row. It is not optional and there is no flag to turn it off. A missing frost value is better than a wrong key. Genus-only (`hydrangea`) is a valid key.
- **Typed names are resolved by the plant lookup, in its one existing call.** The manual add form sends only what was typed, with no genus. `performLookup` returns `resolved_name` (genus, epithet, cultivar, `confidence`, `kind`), and `applyLookupResult` writes it only when the plant's genus is blank, the plant is not photo-identified (`skipCorrection`), and confidence is `high`. Anything less leaves genus blank and the guard skips enrichment. A plant that arrives with a genus never has it changed, and the genus is kept out of species and cultivar corrections.
- **`applyLookupResult` is the single place names are decided**, shared by plant creation, the retry route and the cleanup script. It returns `names`, the plant's name after its updates; enrichment must be keyed on that, never on the pre-lookup row. Don't reimplement name handling at a call site.
- **Typed text is data.** It goes into the lookup prompt as escaped JSON inside `<plant>`; `parseResolvedName` drops anything malformed rather than repairing it. The reply is read with `extractFirstJsonObject`, with one retry if it has no JSON.
- **`species_input` decides the primary name on screen.** It is set when a typed common name ("apple") is resolved to Latin, and by photo identification when the user's wording differed. When set, it is the primary name on the detail page, grid, dashboard and page title, with the Latin name beneath (`typedPlantName`, `lib/plantName.tsx`). Typed Latin, including corrected misspellings, does not set it. Editing the species by hand clears it.
- **Not covered:** `updatePlantField` (inline edit) does not run the plant lookup, so an inline edit gets no genus resolution or spelling correction, and a plant whose genus is blank stays unenriched until its lookup is retried or it is cleaned up. After a retry on a plant older than `PENDING_STALE_MS`, frost data appears on the next page load, not live.
- **Existing blank-genus plants** are handled by `scripts/cleanup-blank-genus.ts` (dry run by default; apply only by explicit `--ids` from a reviewed report; enriches the new key before renaming the plant; writes an undo file; never deletes `species_reference` rows). The model's answers vary a little between runs even at temperature 0, so always apply from the report that was reviewed.

## Conversational scheme save (`/plant-scheme` → `/schemes/[id]`)

Saving a draft (`POST /api/plant-scheme/[draftId]/save`, triggered by `SchemeGenerateAction.tsx`) creates a real `schemes` row (`origin = 'conversation'`, `draft_id` set) and renders through the existing `/schemes/[id]` + `SchemeResults`.

- **"Finalize" mode, not "generate new".** The gardener's `schemePlants` list is the scheme — every add was their explicit choice, and save must never append plants they didn't pick. So it does NOT use `generateScheme()` (which invents companions); it uses `generateSchemeFromSelection` (`lib/scheme-selection-generation.ts`), whose prompt treats the list as fixed. "Add none, drop none" is enforced in code by `mergeSelectionResponse` (`lib/scheme-selection.ts`): exactly one `scheme_suggestions` row per list plant, in order; anything else the model returns is ignored. Per-plant care notes live in `scheme_suggestions.why` for now; a fuller "care through the year" section is deferred (needs a column + UI).
- **One scheme per draft** (unique index on `schemes.draft_id`). A retry reuses the failed row; the old `/api/schemes/[id]/retry` can't rebuild these (suggestion-origin plants have no `plants` row), so failed `origin='conversation'` schemes are filtered out of the `/schemes` and hub lists — retry happens from the draft's own button.
- **Draft is untouched until success.** On success (server-side, inside `after()`) the draft becomes `status = 'saved'`, `scheme_id` set, transcript cleared. `updatePlantSchemeDraft` refuses saved drafts so a stale client write can't undo that. `generationStatus` is never persisted: after a refresh mid-save, `[draftId]/page.tsx` derives it from the scheme row (found via `schemes.draft_id`); a `generating` row untouched for `STALE_GENERATING_MS` counts as abandoned.
- `space` is a fixed `'medium'` — the question flow doesn't ask about bed size yet (known content gap, revisit with the default questions).

## Shopping list name lookup (manual items)

Spec: `docs/specs/shopping-list-manual-add.md` §3. Code: `lib/shopping-lookup/`. A manual shopping list item's typed or dictated name is resolved to a plant in the background.

- **Resolve first, then verify.** The typed text is usually a mangled dictation of a Latin name, so the model resolves it to candidates and Wikipedia only verifies them and grounds the summary. Don't reorder this to "search Wikipedia for the raw text first"; that was the original spec and it misses most real inputs.
- **`shopping_list_items.species` means different things by source.** Scheme items: the full binomial. Manual items: the epithet only, genus in `genus`. Never read `species` directly; use `shoppingItemLatinName`, `manualItemNames` or `plantNameFromShoppingItem` (`lib/shopping-list.ts`).
- **`entered_name` is never written by a lookup.** Only `updateManualItemName` (the user's own rename) changes it.
- **Confidence rules live in `finalConfidence` (`verify.ts`).** A candidate with a cultivar, or one that leaves part of the note unexplained, is capped at medium and shown as a "might be" choice, never auto-applied. These caps were set from eval failures (a confidently wrong Clematis cultivar, an invented cultivar echoed back); don't loosen them without re-running the eval.
- **Run `scripts/eval-shopping-lookup.ts` after any change to the resolver prompt or the confidence rules.** It costs about $0.40 a run against the live API. Ask John before running it.
- **Isolation:** this path must not read or write `species_reference`, or call `performLookup` / `enrichSpeciesReference`. A test enforces it.
- **`after()` uses a bearer-token client, not the cookie client** (`userClientForBackground`): `after()` in a Server Component may not touch cookies, and the page-load pickup runs there. Results are written only while the claim (`lookup_requested_at`) still matches, so a late result can't overwrite a rename or retry.
- **Live updates are by polling** (`router.refresh()` every 5s in `ShoppingList.tsx` while a lookup is in flight), for the same reason as the frost tolerance lookup above.
- **`sounds_like`** (the resolver's scratch field) must never be stored, logged or displayed. `unmatched_text` shown to users is restricted to words from their own note.
