# Prompt 3 — Form submission and waitlist table

**Effort: low. Supabase table + wiring the existing form.**

---

## Context

The request access form was built in Prompt 2 with a TODO comment in place of real submission logic. This prompt wires it up.

---

## 1. Create the waitlist table

Run this migration in Supabase:

```sql
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  garden_notes text,
  created_at timestamptz not null default now()
);

-- No RLS needed — this is write-only from an unauthenticated public form.
-- Restrict to insert only via a Supabase API route (see below).
```

---

## 2. Create an API route for form submission

Create `app/api/waitlist/route.ts`:

```ts
POST /api/waitlist
Body: { email: string, garden_notes?: string }
```

- Validate `email` is present and a valid email format
- Validate `garden_notes` max length 2000 chars if provided
- Insert into the `waitlist` table using the **Supabase service role client** (not the user session client — this route is unauthenticated)
- Return `{ ok: true }` on success
- Return `{ error: string }` with appropriate status codes on failure
- Handle duplicate email gracefully — if the email already exists, return `{ ok: true }` without error (don't reveal whether the email is already registered)

---

## 3. Wire the form

In the request access form component (from Prompt 2), replace the TODO comment with a real async submit:

- On submit: set loading state, POST to `/api/waitlist`
- On success: show the confirmation state (already implemented)
- On error: show an inline error message below the submit button — Inter 13px, terracotta colour. "Something went wrong — please try again."
- Disable the submit button while loading
- The submit button should show "Requesting…" while loading

---

## 4. Environment variable

The Supabase service role key is needed for the API route. Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables (John to do manually — leave a note in the code comment). Add it to `.env.local.example` if that file exists.

---

## Out of scope

- Email confirmation to the user (future)
- Admin view of waitlist entries (future)
- Rate limiting (future — worth adding before any significant traffic)

---

## Verification checklist

- [ ] Submitting the form with a valid email saves to the `waitlist` table in Supabase
- [ ] Submitting with an invalid email shows browser validation error
- [ ] Duplicate email submission returns success without error
- [ ] Loading state shows correctly during submission
- [ ] Confirmation state shows on success
- [ ] Error message shows on failure
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

**Commit message:** `feat: wire request access form to Supabase waitlist table`
