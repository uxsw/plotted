# Claude Code Prompt — Install Prompt Stage 4: iOS Full-Screen Explainer Overlay

## Context

Stages 1–3 are complete: detection utilities, the trigger card, and the Android `beforeinstallprompt` flow all work. This is the final stage: the iOS step-through explainer, since iOS has no programmatic install trigger and needs a proper illustrated walkthrough instead. The trigger card's iOS CTA ("Show me how") is currently stubbed — this stage replaces that stub with the real overlay.

Reference: `docs/specs/pwa/pwa-install-prompt-spec.md`.

## Pre-flight checks

- Confirm there's no existing full-screen overlay/modal pattern in the codebase to reuse (unlikely given `PurchaseDialog`/`ConfirmDialog` are dialog-sized, but check) — if none exists, this stage introduces the pattern fresh
- Confirm Tabler-style icon set or existing icon library conventions in the codebase, to represent Safari's share icon and the "Add to Home Screen" icon as recognisably as possible (actual iOS iconography, not generic abstractions)

## Changes

1. **`PwaIosInstallOverlay` component** (`components/ui/` or similar):
   - Full-viewport overlay — NOT a routed page, no URL change, no navigation history entry. Renders conditionally based on local open/closed state owned by whatever mounts it (likely `PwaInstallTriggerCard` or a sibling state lifted just above it)
   - Slides up or fades in, covers the full screen, clear close (X) control in a corner that always returns to prior scroll/state
   - Three steps, single "Next" progression (swipe gesture optional — not required for v1):
     1. **Payoff screen** — no instruction, just the value prop (reuse/complement copy from the trigger card: launching straight into the garden, no browser chrome)
     2. **"Tap the share icon"** — illustrate the actual Safari share icon (square with upward arrow)
     3. **"Scroll down, tap 'Add to Home Screen'"** — illustrate that specific icon; final action is "Done", not "Install" — closes the overlay, does not claim to trigger anything, since the real action happens in Safari's own share sheet outside this app's control
   - Reaching "Done" on the final step calls `setPwaInstalledAt` (stage 1's server action) as the best-available completion signal, per the spec's noted approximation (no true completion event exists on iOS)
   - Step content should visually match the reference mockup style already agreed (card-based, one action per screen, brand colors/tokens, `Fraunces` for headline text per design system, `Inter` for body)

2. **Wire into `PwaInstallTriggerCard.tsx`**:
   - Replace the iOS stub CTA handler: "Show me how" now opens `PwaIosInstallOverlay` instead of console-logging
   - Dismissing the overlay via the close (X) without reaching "Done" should NOT set `pwa_installed_at` and should NOT count as a dismiss of the trigger card itself (i.e. don't increment `pwa_prompt_dismiss_count` just for closing the explainer early — that's a separate, softer exit than dismissing the original card outright). If you want to track "opened explainer but didn't finish" as its own signal for future analytics, a lightweight console/log-level note is fine, but no schedule-affecting side effect.

## Do-not-touch

- No changes to Android flow, `PwaInstallPromptProvider`, or `beforeinstallprompt` handling from stage 3
- No changes to `shouldShowPwaPrompt`, detection utilities, or the trigger card's Android path
- No routed page/URL for this overlay — must stay a non-navigating overlay
- No real "trigger the install" button inside the overlay — the final step closes the overlay, it doesn't perform an action

## Effort estimate

Medium — mostly a new UI component with no tricky logic, but a full-screen overlay is a new pattern in this codebase (per pre-flight check), so it's worth a bit more care on structure/reusability than a typical component, in case future overlays want to follow the same shape.

## Deliverable format

Direct code changes. After changes, confirm:
- Overlay behaves as a true overlay (no URL/history change) — test explicitly via back-button behaviour
- Close (X) returns to exact prior state without side effects on the dismiss schedule
- Reaching "Done" correctly sets `pwa_installed_at`
- Confirm icon choices used for the share icon and "Add to Home Screen" step, since exact recognisability matters more than usual here
