# Claude Code Prompt — PWA Stage 1: Manifest + Icons + iOS Meta

## Context

Plotted is adding PWA support, scoped as an installable shell with no offline data access (spec: `docs/specs/pwa-support.md`). This is stage 1 of 3: manifest, icons, and iOS-specific meta tags. Stages 2 (offline banner) and 3 (service worker) will follow as separate prompts.

Icons already exist at `public/icons/`:
- `icon-192.png`
- `icon-512.png`
- `icon-512-maskable.png`
- `apple-touch-icon-180.png`

## Pre-flight checks

- Confirm the four icon files listed above are present at `public/icons/` before starting
- Confirm no `app/manifest.ts` or static `public/manifest.json` already exists
- Confirm `app/layout.tsx` location and current structure of its `metadata` export (App Router metadata API)

## Changes

1. Create `app/manifest.ts` using Next.js's native `MetadataRoute.Manifest` return type:
   - `name`: "Plotted"
   - `short_name`: "Plotted"
   - `start_url`: "/plants"
   - `display`: "standalone"
   - `background_color`: "#FAF6EC"
   - `theme_color`: "#2B2A24"
   - `icons`: array with three entries:
     - `public/icons/icon-192.png`, sizes "192x192", type "image/png", purpose "any"
     - `public/icons/icon-512.png`, sizes "512x512", type "image/png", purpose "any"
     - `public/icons/icon-512-maskable.png`, sizes "512x512", type "image/png", purpose "maskable"

2. Update `app/layout.tsx` metadata export to add:
   - `themeColor: "#2B2A24"`
   - `appleWebApp`: `{ capable: true, statusBarStyle: "default", title: "Plotted" }`
   - An `apple-touch-icon` link — via the `icons` field in metadata (`icons: { apple: "/icons/apple-touch-icon-180.png" }`), not a manually written `<link>` tag, to stay consistent with Next.js metadata API conventions

## Do-not-touch

- Do not create a service worker or any offline/caching logic — that's stage 3
- Do not create the offline banner or `useOnlineStatus` hook — that's stage 2
- Do not modify `start_url` beyond `/plants`
- Do not touch existing auth middleware, redirect logic, or any other metadata fields already present in `app/layout.tsx` — only add the fields listed above
- Do not regenerate, resize, or re-export any icon files — use the four provided as-is

## Effort estimate

Low — single file creation plus a small, additive metadata update.

## Deliverable format

Direct code changes (not a written plan). After changes, confirm:
- `app/manifest.ts` created and type-checks cleanly
- `app/layout.tsx` diff is additive only (no removed/reordered existing fields)
- Note whether `next build` surfaces any manifest-related warnings
