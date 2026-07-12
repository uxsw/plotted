# Claude Code Prompt — PWA Stage 3: Service Worker + Offline Fallback Page

## Context

Stages 1 (manifest/icons) and 2 (offline banner) are complete. This is the final stage: a minimal, hand-rolled service worker (no Workbox) that caches the app shell and serves a static offline fallback page on a cold navigation with no connection. Plotted remains online-only — this is not data caching, just making sure a signal-less cold load shows Plotted's own messaging instead of the browser's default error page.

Reference: `docs/specs/pwa-support.md`.

## Pre-flight checks

- Confirm no existing service worker registration or `public/sw.js` present
- Confirm Next.js version/config to identify the correct way to register a service worker client-side (typically a small registration script run from a client component or `useEffect` in root layout)
- Confirm production vs development handling — service worker should register in production only, to avoid interfering with local dev/hot reload

## Changes

1. Create `public/sw.js`:
   - Cache-first strategy for a small, explicit list of static shell assets (icons from `public/icons/`, plus core build output is NOT to be manually listed — do not attempt to enumerate hashed Next.js build files)
   - On `fetch` for navigation requests (`request.mode === 'navigate'`): try network first; on failure, respond with the cached `offline.html`
   - Use a versioned cache name (e.g. `plotted-shell-v1`) and clear old caches on `activate`, so future deploys don't accumulate stale caches

2. Create `public/offline.html`:
   - Static, self-contained HTML (inline styles, no external asset dependencies, since it must work with zero network) matching Plotted's brand colors (`#FAF6EC` background, `#2B2A24` text) and the same offline copy used in stage 2: "You're offline — connect to wifi to view your garden"

3. Register the service worker:
   - Small client-side registration (`navigator.serviceWorker.register('/sw.js')`)
   - Gate on `process.env.NODE_ENV === 'production'`
   - Mount from root layout or a small dedicated client component, matching whatever pattern keeps `app/layout.tsx` changes minimal

## Do-not-touch

- No caching of API responses, Supabase data, or any dynamic route content
- No attempt to enumerate or cache hashed Next.js JS/CSS bundle filenames — cache-first should be scoped to the small static asset list only (icons, offline.html itself)
- No background sync, push notification setup, or periodic sync registration
- No changes to `app/manifest.ts`, `app/(app)/layout.tsx` offline banner, or `useOnlineStatus` hook from stages 1–2
- Do not register the service worker in development — must be production-gated

## Effort estimate

Low–Medium — the service worker logic itself is small, but service worker caching bugs (stale caches surviving a deploy, scope issues) are the one place this stage can bite, so testing a full deploy cycle (old SW → new deploy → cache invalidation) is worth doing before considering this done.

## Deliverable format

Direct code changes. After changes, confirm:
- `public/sw.js` and `public/offline.html` created
- Registration is production-only
- Cache versioning strategy is in place (old caches cleared on activate)
- Flag any risk of the service worker interfering with normal navigation/auth redirects during testing
