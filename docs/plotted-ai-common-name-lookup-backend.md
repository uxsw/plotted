# Plotted — AI Common Name Lookup: Backend
*Spec for Claude Code — medium effort*

---

## Overview

Add AI-powered common name lookup for plants. This spec covers schema migrations, the API route, and feature flagging. UI is covered in a separate spec.

---

## Schema changes (two migrations)

### 1. Add `common_names` to `plants`

```sql
ALTER TABLE plants
ADD COLUMN common_names text[] DEFAULT '{}';
```

### 2. Create `user_flags` table

```sql
CREATE TABLE user_flags (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_lookup_enabled boolean NOT NULL DEFAULT false
);

ALTER TABLE user_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own flags"
  ON user_flags FOR SELECT
  USING (auth.uid() = user_id);
```

Users can read their own flags only. No insert/update policy needed — flags are set manually via Supabase dashboard by admin (for now).

---

## API route

### `POST /api/plants/[id]/lookup-common-names`

**Auth:** Requires valid Supabase session (server-side auth check).

**Feature flag check:** Before doing anything, query `user_flags` for the requesting user. If no row exists or `ai_lookup_enabled = false`, return `403`.

**Flow:**
1. Fetch the plant record (`species`, `cultivar`) for the given `id` — verify it belongs to the authenticated user
2. If `common_names` is already populated, still proceed (allows re-lookup)
3. Call Claude API (`claude-sonnet-4-6`) with the prompt below
4. Parse the response into a string array
5. Return the array to the client — do **not** save to DB at this point (saving is triggered by user selection in the UI)

**Claude prompt:**
```
You are a botanical reference assistant. Given a plant's scientific species name and optional cultivar, return a list of common names used in the United Kingdom.

Species: {species}
Cultivar: {cultivar} (may be empty)

Return ONLY a JSON array of strings, no preamble, no markdown, no explanation. If no common names are known, return an empty array []. Example: ["Foxglove", "Fairy Fingers"]
```

**Response shape:**
```ts
// 200
{ commonNames: string[] }

// 403
{ error: "Feature not available" }

// 404
{ error: "Plant not found" }

// 500
{ error: "Lookup failed" }
```

**Error handling:** If the Claude API call fails or returns unparseable JSON, return 500. Do not throw.

---

## Saving selected names

### `PATCH /api/plants/[id]`

The existing plant update route should accept `common_names: string[]` as a valid field. Confirm this is handled — if the existing PATCH route uses a whitelist of allowed fields, add `common_names` to it.

---

## Notes

- No usage limiting in this spec — deferred until multiple users exist. Track as GitHub issue.
- RLS on `plants` already ensures users can only access their own records.
- The `user_flags` row for your own account needs to be inserted manually in Supabase dashboard after migration:
  ```sql
  INSERT INTO user_flags (user_id, ai_lookup_enabled)
  VALUES ('<your-auth-uid>', true);
  ```
- Commit migrations and API route separately.