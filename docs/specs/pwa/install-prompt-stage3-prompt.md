# Claude Code Prompt — Install Prompt Stage 3: Android `beforeinstallprompt` Flow

## Context

Stage 2 (trigger card + engagement hook) is complete, with the CTA currently stubbed to a console log. This is stage 3 of 4: capturing Chrome's `beforeinstallprompt` event early and wiring it to the trigger card's "Install" CTA on Android, so tapping it triggers the real native install prompt. Stage 4 (iOS explainer overlay) follows separately and is unrelated to this stage's work.

Reference: `docs/specs/pwa/pwa-install-prompt-spec.md`.

## Pre-flight checks

- Confirm root layout structure (`app/layout.tsx`) to find the right place for an early, app-wide effect that isn't tied to any specific route (since `beforeinstallprompt` can fire on any page load, not just `/plants`)
- Confirm there's no existing global client-side provider/context that this should live alongside rather than as a standalone addition

## Changes

1. **`PwaInstallPromptProvider`** (or similarly named context/provider, `components/` or `lib/providers/`):
   - Client component, mounted once near the root (e.g. in `app/layout.tsx`, alongside `ServiceWorkerRegister` from the PWA shell build)
   - On mount, adds a `beforeinstallprompt` listener on `window`:
     - Calls `event.preventDefault()` to stop the browser's own mini-infobar
     - Stashes the event object in React state/context (not local component state that could unmount) so it's available whenever the trigger card's CTA is tapped later, however much later that is
   - Adds an `appinstalled` listener on `window`:
     - On fire, calls `setPwaInstalledAt` (stage 1's server action) to persist the installed flag
   - Exposes the stashed event (or a boolean "can install") and an `install()` function via context, for `PwaInstallTriggerCard` to consume

2. **Update `PwaInstallTriggerCard.tsx`**:
   - Replace the stubbed console-log CTA handler for the Android path: call the provider's `install()` function, which calls `.prompt()` on the stashed `beforeinstallprompt` event
   - After `.prompt()` resolves, check `choice.outcome` (`'accepted'` or `'dismissed'`) — on `'accepted'`, no extra action needed since `appinstalled` will fire separately and persist the flag; on `'dismissed'`, treat it the same as tapping "Not now" (call `dismiss()`) so the backoff schedule still applies
   - If no `beforeinstallprompt` event was ever captured (e.g. unsupported browser, already installed, or criteria not met) by the time the card would render on Android, do not show the trigger card at all on Android in that case — better to show nothing than a button that does nothing when tapped
   - iOS path is unaffected by this stage — still stubbed until stage 4

## Do-not-touch

- No iOS explainer overlay — stage 4
- No changes to `shouldShowPwaPrompt`, `useIsStandalone`, or `platform.ts` from stage 1
- No changes to the mount point or copy in `PwaInstallTriggerCard` beyond wiring the Android CTA handler
- Do not attempt to synthetically trigger or test `beforeinstallprompt` in a way that bypasses real browser criteria — this only fires when Chrome's own install heuristics are met, which is expected and fine

## Effort estimate

Low–Medium — the event capture/stash pattern is the main thing to get right (holding onto a one-time-use browser event across an unpredictable time gap until the user taps a button), everything else is straightforward wiring.

## Deliverable format

Direct code changes. After changes, confirm:
- Provider correctly stashes the event without losing it across re-renders
- `appinstalled` listener reliably sets `pwa_installed_at`
- Card's Android fallback behaviour (hiding itself if no event was captured) is in place
- Flag any risk around testing this locally, since `beforeinstallprompt` requires real install criteria (HTTPS, manifest, service worker) which may behave differently between preview deploys and production
