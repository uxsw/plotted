# Claude Code Prompt — Install Prompt Stage 2: Trigger Card + Engagement Hook

## Context

Stage 1 (detection utilities, persisted state, `shouldShowPwaPrompt`) is complete and migration `023_pwa_prompt_flags.sql` has been run. This is stage 2 of 4: the actual trigger card UI and the hook that decides when to show it, wired into the plant-adding flow. Stages 3 (Android `beforeinstallprompt`) and 4 (iOS explainer overlay) follow separately — this stage's CTA buttons can be stubbed (no-op or console log) since their real behaviour lands in stages 3–4.

Reference: `docs/specs/pwa/pwa-install-prompt-spec.md`.

## Pre-flight checks

- Confirm where plant-count is available/computed (per-user total plants logged) — likely a simple count query or already-available user stat
- Confirm the exact point in the plant-adding flow where a "plant just added" event fires, to hook the engagement check in at the right moment (not on every page load)
- Confirm existing card/notice component patterns (e.g. `AiNoticePanel.tsx`) for visual consistency

## Changes

1. **Unit tests for `shouldShowPwaPrompt`** (flagged in stage 1 as worth adding here): cover the 5 branches — standalone, non-mobile, already-installed, dismiss-count exhausted, threshold-not-yet-met, and the one true-positive "should show" case

2. **`usePwaInstallPrompt` hook** (`lib/hooks/`):
   - Reads `isStandalone` (from stage 1's hook), `isMobileInstallable()`, `pwa_installed_at` and `pwa_prompt_dismiss_count` (from `user_flags`), and current plant count
   - Calls `shouldShowPwaPrompt` with these inputs
   - Exposes `{ shouldShow, dismiss, variant }` — `dismiss()` calls `incrementPwaPromptDismissCount` (stage 1's server action) and updates local state so the card disappears immediately without a refetch
   - `variant` is a hardcoded string constant for now (e.g. `"default"`) — just needs to exist as a field per the spec's future-variant structure, no actual variant logic yet

3. **`PwaInstallTriggerCard` component** (`components/ui/` or similar, matching existing convention):
   - Visual, dismissible, inline (not modal) — icon/illustration + brand-colored surface using existing semantic tokens
   - Copy: "Add Plotted to your home screen for quick access to your garden" (or close variant — feel free to suggest tightened copy, this is a starting point not final)
   - Primary CTA button, text conditional on platform: "Install" if `isAndroid`, "Show me how" if `isIOS`
   - CTA behaviour for this stage: stub only — log to console (`console.log('[pwa] install CTA tapped, platform:', ...)`) rather than wiring real behaviour; a comment noting stages 3/4 will replace this
   - "Not now" dismiss action — calls `dismiss()` from the hook

4. **Mount point**: render `PwaInstallTriggerCard` (gated on `usePwaInstallPrompt().shouldShow`) at the appropriate point in the plant-adding flow — likely right after a successful plant-add confirmation, not globally in the layout, so it appears in-context rather than as a persistent global banner

## Do-not-touch

- No `beforeinstallprompt` capture or handling — stage 3
- No iOS full-screen explainer overlay — stage 4
- No real variant-selection logic — `variant` stays a hardcoded constant
- No analytics/event logging beyond what's needed for the dismiss count itself — deeper event logging can follow once stages 3–4 give the CTAs real behaviour to log
- Do not touch `useIsStandalone`, `platform.ts`, or `pwaPromptSchedule.ts` from stage 1 beyond adding the unit tests

## Effort estimate

Low–Medium — mostly straightforward, the one thing worth care is making sure the engagement check fires at the right moment (post plant-add) rather than re-evaluating on every render/navigation.

## Deliverable format

Direct code changes. After changes, confirm:
- Unit tests pass for all `shouldShowPwaPrompt` branches
- Card only appears once per session even if the plant-add flow re-renders (no flicker/re-trigger)
- Confirm which point in the plant-adding flow the card was mounted at, so it can be reviewed for correct placement
