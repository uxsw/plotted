# Claude Code Prompt — PWA Stage 2: Offline Hook + Banner

## Context

Stage 1 (manifest, icons, iOS meta) is complete. This is stage 2 of 3: detecting offline status client-side and showing a banner. Plotted is online-only — there is no offline data access, so this is purely a messaging layer, not a caching layer. Stage 3 (service worker + offline fallback page for cold loads) follows separately.

Reference: `docs/specs/pwa-support.md`.

## Pre-flight checks

- Confirm current structure of the `(app)` route group layout (where garden/plants/schemes pages live) to identify the right place to mount an app-wide banner
- Confirm whether `(marketing)` pages should be excluded from the offline banner (they should — marketing pages don't depend on Plotted's own data)
- Check for any existing network-status handling in the codebase (unlikely, but confirm no duplicate logic exists)

## Changes

1. Create `useOnlineStatus` hook (suggest `lib/hooks/useOnlineStatus.ts` — match existing hooks directory convention if one exists; check first):
   - Uses `navigator.onLine` for initial state
   - Subscribes to `window`'s `online` and `offline` events to keep state in sync
   - Returns a boolean
   - Guard for SSR (`navigator` undefined on server) — default to `true` (online) until mounted, to avoid hydration mismatch

2. Create an `OfflineBanner` component:
   - Uses `useOnlineStatus`
   - Renders nothing when online
   - When offline, renders a persistent banner with copy: "You're offline — connect to wifi to view your garden"
   - Style using existing semantic design tokens (not primitives) — check existing banner/notice components (e.g. `AiNoticePanel.tsx`) for the established pattern/placement (top-of-viewport fixed vs inline) and follow it for consistency

3. Mount `OfflineBanner` in the `(app)` route group layout only — not in `(marketing)`

## Do-not-touch

- No service worker, no caching, no offline fallback page — that's stage 3
- No changes to `app/manifest.ts` or `app/layout.tsx` from stage 1
- No attempt to queue actions or retry requests when connection returns — purely a status display
- Do not touch `(marketing)` layout

## Effort estimate

Low — one hook, one small component, one layout mount point.

## Deliverable format

Direct code changes. After changes, confirm:
- Component follows existing semantic token usage (no raw primitives)
- Hook has no SSR/hydration warnings on build
- Banner correctly scoped to `(app)` group only
