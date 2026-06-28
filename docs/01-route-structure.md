# Prompt 1 — Route structure and auth-aware homepage routing

**Effort: medium. Structural change to the app's folder layout. Get this right before any design work.**

---

## Context

Plotted currently has all pages under `app/`. We need to introduce two distinct layouts:

- **Marketing layout** — public-facing pages (homepage, future blog). No app header. Clean full-width canvas.
- **App layout** — authenticated pages (`/plants`, `/plants/[id]`, etc.). Has the app header and requires auth.

Additionally, the homepage (`/`) needs to be auth-aware:
- **Logged-out users** → see the marketing homepage
- **Logged-in users** → redirect to `/plants`

---

## Task

### 1. Introduce route groups

Restructure `app/` using Next.js route groups (folder names in parentheses don't affect the URL):

```
app/
  (marketing)/
    page.tsx          ← homepage (move existing or create placeholder)
    layout.tsx        ← marketing layout (no app header, just html shell)
  (app)/
    plants/           ← move existing plants pages here
      page.tsx
      [id]/
        page.tsx
      new/
        page.tsx
    layout.tsx        ← app layout (with app header, auth guard)
  layout.tsx          ← root layout (fonts, globals.css — keep as-is)
  not-found.tsx       ← keep at root level
  globals.css         ← keep at root level
```

### 2. Marketing layout (`app/(marketing)/layout.tsx`)

Minimal — just renders `{children}` with no app header. Should still inherit the root layout's font variables and body styles.

### 3. App layout (`app/(app)/layout.tsx`)

Move any existing app shell/header into this layout if it exists. Add a server-side auth check — if no session, redirect to `/` (the marketing homepage).

### 4. Auth-aware homepage (`app/(marketing)/page.tsx`)

Server component. Check Supabase session:
- If logged in → `redirect('/plants')`
- If logged out → render a simple placeholder: `<main><p>Marketing page coming soon.</p></main>`

The real marketing page content comes in Prompt 2.

### 5. Verify all existing routes still work

`/plants`, `/plants/new`, `/plants/[id]` should all resolve correctly after the restructure. Update any internal imports or path references that break.

---

## Out of scope

- No design work on the marketing page (that's Prompt 2)
- No new Supabase tables
- No font changes

---

## Verification checklist

- [ ] Visiting `/` while logged out shows the placeholder
- [ ] Visiting `/` while logged in redirects to `/plants`
- [ ] Visiting `/plants` while logged out redirects to `/`
- [ ] Visiting `/plants` while logged in works as before
- [ ] `/plants/new` and `/plants/[id]` still work
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes

**Commit message:** `refactor: introduce route groups for marketing and app layouts with auth-aware homepage`
