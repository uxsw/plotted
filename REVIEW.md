# Code & Security Review — Garden Portfolio App

Reviewed by: Claude (claude-sonnet-4-6)
Date: 2026-06-20
Stack: Next.js 16 App Router, TypeScript, Tailwind, Supabase (Postgres/Auth/Storage), Vercel

---

## Critical

### 1. Storage bucket is public — any authenticated (or unauthenticated) user can read any photo
**File:** `supabase/migrations/001_plants.sql`, lines 55–62 (comments)

The migration comment specifies the bucket is created with `public: true` and the read policy is `bucket_id = 'plant-photos'` (no user scope). This means every plant photo is world-readable by URL, including photos belonging to other users.

For a private portfolio this is a meaningful data exposure: anyone who obtains or guesses a photo URL can view it without authentication.

**Suggested fix:** Create the bucket with `public: false`. Serve photos via Supabase signed URLs (`storage.createSignedUrl`) instead of `getPublicUrl`. The write policy (path must start with `auth.uid()`) is fine as-is.

---

### 2. `user_id` is supplied from the client on INSERT — RLS is the only guard
**File:** `components/PlantForm.tsx`, lines 144–146

```ts
const { data: { user } } = await supabase.auth.getUser();
// ...
.insert({ ...payload, user_id: user.id })
```

The `user_id` value is set by the browser and sent over the wire. The RLS `WITH CHECK (auth.uid() = user_id)` policy will reject a mismatch, so this is not a bypass — but it's worth noting that the database is the sole enforcement layer here. If RLS were ever accidentally disabled, any logged-in user could insert rows with an arbitrary `user_id`.

**Suggested fix:** Use a database-level default: `user_id uuid not null default auth.uid() references auth.users(id)`. This removes the client from the trust chain entirely; the insert payload no longer needs to include `user_id`.

---

### 3. Proxy matcher excludes static image extensions but not `public/` asset paths
**File:** `proxy.ts`, lines 9–12

```ts
matcher: [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
],
```

The matcher excludes `_next/static`, `_next/image`, and common image extensions, but it does NOT exclude `public/` directory assets (e.g. `robots.txt`, `sitemap.xml`, or any files placed in `/public`). Those requests will pass through the auth redirect logic in `updateSession`. For this app the impact is low (no sensitive public assets currently), but it is a correctness gap that can cause hard-to-debug redirects if public assets are added later.

**Suggested fix:** Add `/public/` to the exclusion list, or follow the pattern from the Next.js 16 docs:
```
/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)
```

---

### 4. Logout does not invalidate the session server-side
**File:** `components/LogoutButton.tsx`, lines 10–14

`supabase.auth.signOut()` called from the browser client signs the user out locally and clears the cookie, but it calls the Supabase `/auth/v1/logout` endpoint which revokes the refresh token. However, the active JWT (short-lived) remains valid until it expires. If the session cookie is captured (e.g. via XSS or a shared browser session), the attacker retains access for the remainder of the JWT TTL.

The deeper issue is that logout is purely client-driven. If JavaScript fails, the user is not signed out. Consider adding a server-side sign-out route (a Route Handler that calls `supabase.auth.admin.signOut(session_id)` and clears cookies) and redirecting to it from the button.

**Suggested fix (minimal):** Add `{ scope: 'global' }` to `signOut()` to invalidate all sessions for the user, not just the current one:
```ts
await supabase.auth.signOut({ scope: 'global' });
```

---

## Should Fix

### 5. Reset-password page does not verify a valid token is present before rendering the form
**File:** `app/auth/reset-password/page.tsx`

The page renders immediately without checking whether a valid password-reset token exists in the URL hash. The Supabase `PKCE` callback flow should establish a session via `/auth/callback` before landing here, but if a user navigates directly to `/auth/reset-password` with no token (or an expired one), they see a password form. `updateUser({ password })` will fail with an error (`Auth session missing`), which is shown, but the UX is confusing and the empty form is accessible to anyone.

**Suggested fix:** In a `useEffect`, call `supabase.auth.getSession()` on mount; if no session is present, redirect to `/auth/login?error=invalid_reset_link`.

---

### 6. `flowering_season_from` / `_to` has no cross-field validation
**File:** `components/PlantForm.tsx`, lines 274–298

The form lets a user pick a `flowerFrom` month greater than `flowerTo` month (e.g. "from December, to January"). There is no client-side or database-level check that `flowering_season_from <= flowering_season_to`. For a wrap-around season (e.g. a plant that flowers Nov–Jan) this may be intentional, but the spec does not mention it and the display code in `PlantList.tsx` and `PlantDetail` does not handle it specially — it will just show "Nov–Jan" which is visually correct, but downstream logic (e.g. companion-planting matching) may not handle the wrap.

**Suggested fix:** Add a client-side note/warning if `from > to` ("Flowering season wraps the year — is this intentional?"), and document the wrap semantics in the spec for v2.

---

### 7. `PlantForm` edit path does not include `user_id` in the UPDATE `.eq()` filter
**File:** `components/PlantForm.tsx`, line 139

```ts
const { error } = await supabase.from("plants").update(payload).eq("id", plant.id);
```

The UPDATE is filtered only by `id`. The RLS `USING (auth.uid() = user_id)` policy prevents a user from updating another user's row, so this is not a data-corruption risk. However, if a bug or future refactor disables RLS, this filter alone would be insufficient. Adding `.eq("user_id", user.id)` makes the application layer self-defensive.

**Suggested fix:** `.update(payload).eq("id", plant.id).eq("user_id", user.id)`

---

### 8. `DeletePlantButton` does not check for errors
**File:** `components/DeletePlantButton.tsx`, lines 11–14

```ts
await supabase.from("plants").delete().eq("id", id);
router.push("/plants");
```

The delete result is not inspected. If the delete fails (network error, RLS rejection), the user is silently redirected to the list as if deletion succeeded, where the plant will still appear.

**Suggested fix:** Destructure `{ error }`, and show an error message (or `alert()`) if `error` is non-null before navigating away.

---

### 9. `next.config.ts` image hostname is an open wildcard for all Supabase projects
**File:** `next.config.ts`, lines 5–10

```ts
hostname: "*.supabase.co",
```

This allows the Next.js Image optimizer to proxy images from any Supabase project, not just yours. If an attacker can get your app to render an `<Image src="https://attacker-project.supabase.co/...">`, your server will proxy it.

**Suggested fix:** Replace the wildcard with your specific project hostname: `<project-ref>.supabase.co`.

---

### 10. Login error messages pass Supabase SDK error strings directly to the UI
**File:** `app/auth/login/page.tsx`, line 36

```tsx
{error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
```

`error.message` from Supabase can be specific enough to reveal whether an email address is registered (e.g. "Email not confirmed" vs "Invalid login credentials"). Supabase's default error for wrong password vs unknown email is the same generic string, but this can vary by Supabase version or future changes.

The forgot-password page handles this correctly (line 35: "If an account exists for …"). The login page should do the same.

**Suggested fix:** Map all auth errors to a single generic message: `"Invalid email or password."` Do not pass `error.message` directly.

---

### 11. `PlantForm` year range is capped at 30 years back; no future years allowed
**File:** `components/PlantForm.tsx`, line 158

```ts
const yearOptions = Array.from({ length: 30 }, (_, i) => now.getFullYear() - i);
```

Users cannot record a plant planted more than 30 years ago (e.g. a mature tree planted in the 1990s). The range also does not include future years (e.g. for planning a planting next spring).

**Suggested fix:** Extend the past range (e.g. 50 years) and add 1–2 future years to support planning.

---

## Nice to Have

### 12. `species_name` normalization is app-layer only — not enforced by the database
**File:** `supabase/migrations/001_plants.sql`, line 6 (comment: "normalized: lowercase, trimmed")
**File:** `components/PlantForm.tsx`, line 124

```ts
species_name: speciesName.trim().toLowerCase() || null,
```

Normalization happens only in `PlantForm.handleSubmit`. If another code path inserts a plant (e.g. a future API route, a seed script, or a Supabase dashboard edit), the constraint is silently bypassed, causing future companion-planting lookups to miss matches.

**Suggested fix:** Add a Postgres trigger or generated column to enforce lowercase+trim at the DB level:
```sql
create or replace function normalize_species_name()
returns trigger language plpgsql as $$
begin
  new.species_name = lower(trim(new.species_name));
  return new;
end;
$$;
create trigger plants_normalize_species
  before insert or update on plants
  for each row when (new.species_name is not null)
  execute function normalize_species_name();
```

---

### 13. `PlantForm` photo upload path includes a timestamp, making old photos orphaned on edit
**File:** `components/PlantForm.tsx`, lines 100–107

```ts
const path = `${userId}/${Date.now()}.jpg`;
// ...
const { data } = supabase.storage.from("plant-photos").getPublicUrl(path);
return data.publicUrl;
```

Each edit that includes a new photo uploads to a new path. The old photo remains in Storage and accumulates indefinitely. There is no cleanup of the previous `photo_url`.

**Suggested fix:** On edit, delete the old photo before uploading the new one:
```ts
if (plant?.photo_url) {
  const oldPath = plant.photo_url.split('/plant-photos/')[1];
  if (oldPath) await supabase.storage.from('plant-photos').remove([oldPath]);
}
```

---

### 14. `PlantList` checkbox "select all" does not account for partial-page loads
**File:** `components/PlantList.tsx`, lines 67–70

```tsx
checked={selected.size === plants.length}
```

When `plants.length === 0`, `selected.size === 0` evaluates to `true`, so the "select all" checkbox appears checked in the empty-state — but the empty-state renders a separate div, so this code path is not reachable in practice. Still, the check should be `plants.length > 0 && selected.size === plants.length` for correctness.

---

### 15. `.env.local.example` is minimal — no instructions or placeholder comments
**File:** `.env.local.example`

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

No comment pointing to where these values can be found (Supabase dashboard → Project Settings → API), or mentioning that `.env.local` should never be committed. Low-effort improvement for onboarding.

---

### 16. `auth/callback/route.ts` — `next` query parameter is not validated
**File:** `app/auth/callback/route.ts`, lines 7–14

```ts
const next = searchParams.get("next") ?? "/";
// ...
return NextResponse.redirect(`${origin}${next}`);
```

The `next` parameter is used directly in a redirect. If `next` were crafted as an absolute URL (e.g. `?next=//evil.com`), `${origin}${next}` would produce `https://yourdomain.com//evil.com`, which browsers may follow as a redirect to `evil.com`. This is an open-redirect risk.

**Suggested fix:** Validate that `next` starts with `/` and does not start with `//`:
```ts
const next = searchParams.get("next") ?? "/";
const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
return NextResponse.redirect(`${origin}${safeNext}`);
```

---

### 17. `app/page.tsx` root redirect is unauthenticated — no auth check before redirecting
**File:** `app/page.tsx`

```ts
redirect("/plants");
```

The root page unconditionally redirects to `/plants`. The proxy/middleware catches unauthenticated requests to `/plants` and redirects to `/auth/login`, so there are two redirects for an unauthenticated user hitting `/`. This is a minor UX inefficiency (two round-trips), not a security issue.

**Suggested fix (optional):** Redirect unauthenticated visitors directly to `/auth/login` from the root page by reading the session, or simply redirect `/` → `/auth/login` when unauthenticated in `updateSession`.

---

## Notes

### Migration vs. spec accuracy

The SQL migration matches the spec accurately:
- All spec fields are present with correct types and nullability.
- `soil_type` and `water_needs` are correctly absent — not forgotten, not present.
- `date_planted` is `date` type. Day-as-1 logic is in `PlantForm.tsx` line 125: `` `${plantedYear}-${plantedMonth.padStart(2, "0")}-01` ``.
- `flowering_season_from` / `_to` are stored as `integer` with `CHECK (between 1 and 12)` — not enum/text.
- `status` is `text NOT NULL DEFAULT 'active'` with a `CHECK (status in ('active', 'removed'))` constraint — not a Postgres enum. This is appropriate and matches the spec.
- `eventual_height_cm` / `eventual_spread_cm` are `integer`.
- `created_at` and `updated_at` both exist as `timestamptz NOT NULL DEFAULT now()`.
- `updated_at` **does auto-update** via the `plants_updated_at` BEFORE UPDATE trigger calling `update_updated_at()` (lines 23–33). This is correctly implemented.

### RLS summary

RLS is correctly enabled and all four operations (SELECT, INSERT, UPDATE, DELETE) have policies scoped to `auth.uid() = user_id`. The INSERT policy uses `WITH CHECK` (correct). The UPDATE policy uses both `USING` and `WITH CHECK` (correct). No overly permissive `USING (true)` policies. The main gap is the `user_id` default (see Critical finding #2).

### Auth flows summary

- Signup correctly shows an "Check your email" screen and does not auto-login, communicating that email verification is required.
- Forgot-password correctly uses the opaque "If an account exists…" message (no enumeration).
- The Supabase client uses `@supabase/ssr` (`createBrowserClient`, `createServerClient`) — the current recommended pattern, not the deprecated `auth-helpers`.
- `proxy.ts` is the correct Next.js 16 file convention (renamed from `middleware.ts` in v16).
- Protected routes are guarded at both the proxy layer (`updateSession` in `lib/supabase/middleware.ts`) and the server component layer (`app/(protected)/layout.tsx`). Double protection is good.
- The proxy `isProtected` check (line 34) excludes `_next` paths but not `public/` paths (see Critical finding #3). The `isAuthPage` check uses `startsWith("/auth")` which is correct — the callback route at `/auth/callback` is therefore also excluded from the auth-redirect guard.

### No hardcoded credentials

No hardcoded Supabase URLs or keys were found. All references use `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`. `.env.local.example` exists and is correct (though sparse — see finding #15).

### TypeScript `any` usage

No `any` usage found in the reviewed data-fetching code or types. `lib/types.ts` is fully typed with no `any`.

---

## Recommended Fix Order

1. **[Critical #1]** Switch the `plant-photos` storage bucket to private and serve photos via signed URLs — prevents exposure of all user photos.
2. **[Critical #4 + Should Fix #5]** Fix logout to use `{ scope: 'global' }` and add session validation to the reset-password page — closes the two most likely auth abuse paths.
3. **[Nice to Have #16]** Validate the `next` open-redirect in `auth/callback/route.ts` — one-liner fix, low effort, meaningful security improvement.
4. **[Critical #2]** Move `user_id` to a DB-level default (`DEFAULT auth.uid()`) — removes client from the trust chain.
5. **[Should Fix #8]** Handle errors in `DeletePlantButton` — prevents silent data-loss confusion.
6. **[Should Fix #10]** Normalize login error messages to prevent any future user-enumeration leak.
7. **[Should Fix #9]** Narrow the `next.config.ts` image hostname to your specific Supabase project ref.
8. **[Should Fix #7]** Add `.eq("user_id", user.id)` to the UPDATE call in `PlantForm`.
9. **[Nice to Have #12]** Add a DB trigger to enforce `species_name` normalization — critical before v2 companion-planting is built.
10. **[Nice to Have #13]** Clean up orphaned Storage objects when a photo is replaced on edit.
