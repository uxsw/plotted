# Garden Portfolio App — MVP Spec (v1)

## Stack
- **Frontend/Backend:** Next.js (App Router)
- **Database / Auth / Storage:** Supabase (Postgres + Auth + Storage for photos)
- **Hosting:** Vercel

## MVP Scope (what we're building first)
- User signup/login (email + password via Supabase Auth)
- Each user has their own private plant portfolio
- Add / edit / delete a plant entry
- View portfolio as a list and as individual plant detail pages
- Upload a photo per plant
- Select a subset of plants (checkboxes) — UI hook for future "recommendations on selection" feature, but no AI logic yet

## Explicitly deferred (not in MVP, but schema should not block them later)
- Companion planting / style suggestions (curated dataset or live AI — decide later)
- Garden zones/beds (location is a free-text field for now, not a relation)
- Sharing portfolios between users / public profiles
- Search/filtering beyond basic list

## Data Model

### `users` (handled by Supabase Auth)
Standard Supabase auth table — id, email, created_at. No custom user table needed yet unless we want profile fields (display name etc.) — can add later.

### `plants`
| Field | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| user_id | uuid | FK to auth.users, RLS scoped |
| common_name | text | required |
| species_name | text | optional — Latin/botanical name, important for future companion-planting matching, keep normalized (lowercase, trimmed) |
| date_planted | date | month/year only — UI collects month + year, defaults to current month/year, day stored as 1 internally and ignored in display |
| photo_url | text | Supabase Storage reference |
| location | text | free-text for MVP (e.g. "back bed", "patio pot") — future-proofed to become a FK to a `locations` table later without renaming this field |
| sun_needs | enum/text | full sun / partial shade / full shade |
| flowering_season_from | int (1–12) | start month of flowering range |
| flowering_season_to | int (1–12) | end month of flowering range |
| eventual_height_cm | integer | expected mature height in cm |
| eventual_spread_cm | integer | expected mature spread in cm |
| purchased_from | text | freeform — nursery/shop/source name |
| status | enum | active / removed — soft delete so history isn't lost |
| notes | text | freeform |
| created_at | timestamp | |
| updated_at | timestamp | |

### Row-Level Security (RLS)
Supabase RLS policies ensure each user can only read/write their own `plants` rows (`user_id = auth.uid()`). This is set up once at the database level — not something we re-check in app code each time.

## Why this shape supports the roadmap
- **Companion planting (v2):** `species_name` becomes the join key against a future `companion_pairs` reference table (curated) or the input fed to an AI reasoning call. No migration of existing plant data needed.
- **Garden zones (v2):** `location` text field can be left as-is for casual users, or upgraded — add a `locations` table and a `location_id` FK column alongside the existing text field (don't need to drop the text column, just stop using it for new entries).
- **Subset-based recommendations:** UI just needs multi-select on the existing plant list; no schema change required, this is purely a frontend + API-call feature when we build it.

## Open questions for next session
- Do we want soft-delete (`status: removed`) visible anywhere in MVP, or just delete-means-delete for now?
- Any specific fields you want added/removed from the structured list above?
