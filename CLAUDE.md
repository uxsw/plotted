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