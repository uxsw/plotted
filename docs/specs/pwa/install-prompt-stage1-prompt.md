# Claude Code Prompt — Install Prompt Stage 1: Detection Utilities + Persisted State

## Context

Plotted's PWA shell is live. This is stage 1 of 4 for making installation discoverable: a set of detection utilities (is the app running standalone, is the device mobile-installable) and persisted state (dismiss count, installed flag) that later stages will build on. This stage has no visible UI — it's the foundation layer.

Reference: `docs/specs/pwa/pwa-install-prompt-spec.md` (and `docs/specs/pwa/pwa-support.md` for prior PWA context).

## Pre-flight checks

- Confirm where user-scoped persisted flags currently live (likely a Supabase table/column pattern already used for something similar, e.g. the `lookup_notice_seen_at` pattern mentioned in project conventions) — use the same storage approach for consistency, don't introduce a new mechanism
- Confirm existing hooks directory convention (`lib/hooks/`, per stage 2 of the PWA shell build)

## Changes

1. **`lib/hooks/useIsStandalone.ts`** — hook returning boolean:
   - `matchMedia('(display-mode: standalone)').matches || navigator.standalone === true`
   - SSR-safe (guard for `window`/`navigator` undefined, default `false` until mounted — mirrors the pattern used in `useOnlineStatus`)

2. **`lib/utils/platform.ts`** — plain utility functions (no hook needed, these don't change at runtime):
   - `isIOS(): boolean` — UA contains `iPhone|iPad|iPod`, OR (UA contains `Mac` AND `navigator.maxTouchPoints > 1`) for iPadOS 13+ detection
   - `isAndroid(): boolean` — UA contains `Android`
   - `isMobileInstallable(): boolean` — `isIOS() || isAndroid()`
   - Add a code comment explaining UA sniffing is used deliberately here (no reliable feature-detection alternative exists for this specific check) and that iPadOS detection specifically depends on the Mac+touch combination — flag this so it isn't "simplified" later in a way that breaks iPad detection

3. **Persisted state** — extend whatever the existing per-user flag storage mechanism is (per pre-flight check) with:
   - `pwa_prompt_dismiss_count` (integer, default 0)
   - `pwa_installed_at` (nullable timestamp)
   - Expose simple read/write helpers consistent with how existing flags (e.g. notice-seen timestamps) are read/written in this codebase — match existing conventions rather than introducing a new pattern

4. **`lib/utils/pwaPromptSchedule.ts`** — pure function, no side effects:
   - Exports `PWA_PROMPT_THRESHOLDS = [2, 7, 14, 27]`
   - `shouldShowPwaPrompt({ isStandalone, isMobileInstallable, installedAt, dismissCount, plantCount }): boolean` — encapsulates the full decision logic from the spec (not standalone, is mobile, never installed, dismiss count under threshold array length, plant count meets the current threshold)
   - Keep this function pure and fully unit-testable — no reads from storage inside it, just take all inputs as arguments

## Do-not-touch

- No trigger card UI, no engagement hook wiring it into the plant-adding flow — that's stage 2
- No `beforeinstallprompt` handling — that's stage 3
- No iOS explainer overlay — that's stage 4
- Do not wire any of this into actual UI yet; this stage produces utilities and storage only
- Do not touch existing PWA shell files (manifest, service worker, offline banner) from the prior build

## Effort estimate

Low — utility functions and a storage extension, no UI.

## Deliverable format

Direct code changes. After changes, confirm:
- `shouldShowPwaPrompt` is pure and easily testable in isolation (flag if a quick unit test is worth adding here, given it's the core decision logic for the whole feature)
- Persisted flag storage matches existing codebase conventions rather than introducing a new pattern
- Note any assumption made about where per-user flags are stored, in case it differs from what the codebase actually uses
