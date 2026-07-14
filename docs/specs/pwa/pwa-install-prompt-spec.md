# PWA Install Prompt & Discoverability

## Context

The PWA shell (manifest, icons, offline banner, service worker) is built and deployed. Installability itself is invisible without prompting — neither iOS nor Android surfaces it natively in a way users will notice. This spec covers making installation discoverable and easy: an in-flow trigger card, a scheduled re-prompt backoff for users who dismiss, and a dedicated iOS step-through explainer (Android uses the native `beforeinstallprompt` flow instead, needing far less UI).

Builds on `docs/specs/pwa/pwa-support.md`. Brand tone for this feature: confident and visually strong, not pushy — closer to how Headspace sells a habit than how apps nag for permissions.

## Detection logic

**Is the user currently running the installed PWA?**
- `window.matchMedia('(display-mode: standalone)').matches` (Android/Chrome/desktop)
- `navigator.standalone === true` (iOS Safari's own flag)
- Combine: `isStandalone = matchMedia(...).matches || navigator.standalone === true`
- If true, never show the prompt — they're already in it.

**Is the device one a PWA can meaningfully be installed on (i.e. mobile)?**
- iOS: UA contains `iPhone|iPad|iPod`, OR (UA contains `Mac` AND `navigator.maxTouchPoints > 1`) — the latter catches iPadOS 13+, which disguises its UA as desktop Safari
- Android: UA contains `Android`
- `isMobileInstallable = isIOS || isAndroid`
- Desktop never sees the prompt, regardless of engagement trigger.
- Note: UA sniffing is inherently a bit fragile (Apple/Google can shift UA strings). Comment this clearly in code and flag in `CLAUDE.md` so it isn't "cleaned up" into something more elegant that quietly breaks iPad detection.

**Has the user already installed (ever), even if not currently standalone?**
- No reliable cross-context API for this (`getInstalledRelatedApps()` is poorly supported and not fit for purpose here).
- Rely on a persisted flag instead: set `pwa_installed_at` the moment we detect installation (Android: `appinstalled` event fires on `window`; iOS: no equivalent event — see note below).
- Once ever installed, never show the prompt again, regardless of current `isStandalone` state (covers someone who installs then later manually removes it from their home screen — we don't re-prompt).
- **iOS gap to flag**: there's no `appinstalled`-equivalent event on iOS, so we can't reliably confirm they completed the walkthrough vs. just viewed it. Treat "completed the iOS explainer walkthrough" (reached the final step) as an approximation of installed intent, and set `pwa_installed_at` at that point rather than leaving iOS permanently un-trackable. This is a known imperfect proxy — acceptable given no better signal exists.

## Trigger & re-prompt schedule

- Persisted per user: `pwa_prompt_dismiss_count` (integer, starts 0)
- Thresholds (total plants logged): `[2, 7, 14, 27]`, indexed by dismiss count
- Show the trigger card when: `!isStandalone && isMobileInstallable && !pwa_installed_at && plantCount >= thresholds[pwa_prompt_dismiss_count]` and it hasn't already been shown for the current threshold
- On dismiss: increment `pwa_prompt_dismiss_count`
- After 4 dismissals (all thresholds exhausted), stop showing permanently — no further checks needed once `pwa_prompt_dismiss_count >= 4`
- On install (detected per above), stop permanently regardless of dismiss count

## Structure for future A/B variants (build now, don't use yet)

- Trigger card component takes a `variant` prop/identifier, even though only one variant exists today
- Scheduling logic (when to show) stays fully decoupled from content/variant selection (which card to show) — two separate concerns, two separate functions
- Log shown/dismissed/installed events with the variant id attached from the start
- No actual variant-selection logic or analytics dashboard needed now — just don't hardcode assumptions that would require reworking this later. Natalie to be looped in when the variant-testing layer itself gets built (not this pass).

## Trigger card (in-flow, dismissible)

- Appears inline within the flow, not a blocking modal — non-interruptive
- Visual, not just text: icon/illustration of Plotted "installing" onto a phone, brand colors
- Copy: value-prop framed, e.g. "Add Plotted to your home screen for quick access to your garden" — not "install our PWA"
- Single primary CTA:
  - **Android**: "Install" — wired to the captured `beforeinstallprompt` event (see below)
  - **iOS**: "Show me how" — opens the full-screen explainer overlay
- Dismiss action ("Not now") — low-stakes visually, increments dismiss count on tap

## Android install flow

- Capture `beforeinstallprompt` early (top-level effect, e.g. root layout or a small provider) — it can fire well before the engagement trigger condition is met, so stash the event silently and hold it until needed rather than reacting immediately
- On trigger card's "Install" tap: call `.prompt()` on the stashed event
- Listen for `appinstalled` on `window` — on fire, set `pwa_installed_at` and permanently suppress future prompts
- If `beforeinstallprompt` was never captured (unsupported browser/context), fall back to not showing the trigger card at all on Android rather than showing a broken CTA

## iOS explainer (full-screen overlay)

- Full-viewport overlay, not a routed page — no URL change, no navigation history entry, dismiss returns to exact prior scroll/state
- Slides up / fades in, covers full screen, clear close (X) in a corner
- Three steps, one action per screen, step-through via "Next" (swipe optional, not required):
  1. Payoff/value screen — no instruction yet, sets the "why"
  2. "Tap the share icon" — illustrate Safari's actual share icon (square with up arrow), not a generic icon
  3. "Scroll down, tap 'Add to Home Screen'" — illustrate that specific menu icon, ends on "Done" (not "Install" — closes the overlay, doesn't trigger anything, since the real action happens in Safari's own UI outside our control)
- Reaching the final step ("Done") sets `pwa_installed_at` as our best-available completion signal (see detection gap noted above)

## Do-not-touch

- No changes to existing manifest, icons, service worker, or offline banner from prior PWA stages
- No actual variant-testing/experimentation framework — structure for it, don't build it
- No GA/analytics instrumentation beyond simple event logging with variant id attached — deeper analytics work is Natalie's territory, loop her in separately
- No attempt to detect "installed but not currently standalone" via any live API — rely on the persisted flag approach only
- Do not build a desktop version of this prompt

## Effort estimate

**Medium** — more surface area than the shell build (detection logic, persisted state with backoff schedule, two distinct install paths for iOS vs Android, a full-screen overlay component with illustrated steps), but each piece is individually simple. Suggest staging as:
1. Detection utilities + persisted state (standalone check, mobile check, dismiss count, thresholds)
2. Trigger card component + engagement hook (mount point, show/dismiss logic)
3. Android `beforeinstallprompt` capture + install flow
4. iOS full-screen explainer overlay

## Deliverable format

Staged Claude Code prompts, one per stage above, each independently reviewable before proceeding — consistent with prior PWA work.
