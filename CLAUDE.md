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
