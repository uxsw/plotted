# PWA Support — Shell Only (Online-Required)

## Context

Plotted currently runs as a standard web app with no installability or home-screen presence. This spec scopes a minimal, online-only PWA: installable on iOS/Android, with icons, a manifest, an offline banner, and Android splash generation. It deliberately excludes offline data access, background sync, and push notifications — those require a different architecture (local-first sync or API response caching) and aren't justified by current beta usage.

A GitHub issue already exists tracking PWA support; this spec fulfils it at shell scope.

## Pre-flight checks

- [ ] Confirm final icon files are in place: `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon-180.png` (all PNG, opaque background, maskable variant has safe-zone padding already baked in)
- [ ] Confirm `/plants` renders correctly as a first-load route for a logged-out or logged-in user (i.e. auth redirect behaviour is sane when this is the literal launch URL)
- [ ] Confirm no existing `manifest.json` or service worker registration already present in the repo (check `public/` and `app/`)

## Changes

### 1. Icons
- Copy the four provided PNGs into `public/icons/`
- No regeneration or resizing — use as provided

### 2. Manifest
- Add `app/manifest.ts` (Next.js App Router native manifest support, no static JSON file needed)
- Fields:
  - `name`: "Plotted"
  - `short_name`: "Plotted"
  - `start_url`: `/plants`
  - `display`: "standalone"
  - `background_color`: `#FAF6EC`
  - `theme_color`: `#2B2A24`
  - `icons`: 192 (any), 512 (any), 512 (maskable)

### 3. iOS-specific meta
- Add `apple-touch-icon` link (180×180) and standard `apple-mobile-web-app-*` meta tags via `app/layout.tsx` metadata export
- No custom iOS splash image in this pass (see Deferred)

### 4. Offline banner
- New `useOnlineStatus` hook (`navigator.onLine` + `online`/`offline` listeners)
- Small banner/full-screen state component, shown app-wide when offline: "You're offline — connect to wifi to view your garden"
- Wire into root layout so it applies across `(app)` route group at minimum (marketing pages likely don't need it)

### 5. Offline fallback page + minimal service worker
- Hand-rolled service worker (no Workbox) registered only in production
- Cache-first for static shell assets (icons, core CSS/JS bundle entry)
- On navigation failure with no cache hit, serve a static `offline.html` fallback so a cold load with no connection shows Plotted's own messaging instead of a browser error screen

## Do-not-touch

- No offline data caching, sync, or local-first storage of garden/plant/scheme data
- No background sync or push notification setup
- No custom iOS splash screen (tracked as follow-up, see below)
- No changes to `start_url` beyond `/plants` — do not attempt to pre-build dashboard routing
- No changes to existing auth middleware or redirect logic

## Effort estimate

**Low** — roughly one session. Manifest, icons, and offline banner are all small, well-contained additions. The service worker is the only part requiring care (cache-first vs network-first behaviour, avoiding stale asset caching across deploys), but at shell scope it stays simple.

## Deliverable format

Staged Claude Code prompt(s), broken into:
1. Manifest + icons + iOS meta tags
2. Offline hook + banner component
3. Service worker + offline fallback page

Each stage independently reviewable/testable before moving to the next.

## Follow-up (out of scope, tracked separately)

- **iOS custom splash screen** — requires explicit `<link rel="apple-touch-startup-image">` entries (or a modern SVG-with-media-query approach) since iOS Safari does not generate splash from the manifest. To be scoped as its own small follow-up spec once shell PWA is confirmed working.
- **`start_url` update to dashboard route** — when a dedicated dashboard screen ships, update `start_url` in `app/manifest.ts` from `/plants` to the new route. One-line change, no migration needed.
