# Shopping List — Stage 1 Spec

## Overview

Introduces a shopping list feature, starting from the suggested plants list on planting scheme pages. Users can add suggested plants to a personal shopping list, manage that list, and mark items as purchased — optionally creating a plant record automatically.

## Goals

- Replace the delete action on suggested plants with "add to shopping list."
- Build a shopping list page: thumbnail, species, cultivar, common name(s), link back to originating scheme.
- Support hard delete and "purchased" flows on shopping list items.
- On purchase, optionally create a plant record with a snapshotted image and correct attribution.
- Track image source/attribution properly so attribution only displays where it's actually owed.

## Non-goals (deferred, tracked as GitHub issues)

- Additional entry points into the shopping list beyond the suggested plants list.
- "Best time to shop for this plant" seasonal notes.
- "Similar plant" alternative suggestions.
- Any scheme provenance stored on the resulting plant record.

---

## 1. Suggested Plants List Changes

- Remove the delete button/action from suggested plant cards.
- Replace with an add-to-shopping-list icon cart.
- Action is one-directional: adding does not toggle back to "remove" from this view. On click:
  - If the plant is not already in the user's shopping list: create the entry, show a brief "Added" confirmation (icon swap to checkmark for the session, or toast).
  - If it's already in the list: treat as a no-op but still show the "Added" confirmation — no duplicate row, no error state surfaced to the user.
- First-time introduction: reuse the show-once/auto-hide notice pattern from `AiNoticePanel`, but do not reuse the gold tint — that's semantically tied to AI-generated content notices elsewhere in the app. Introduce a third neutral variant (sand/paper tones) for general feature-introduction notices, sharing the same persisted-timestamp mechanism. Flag exact colour choice for review before implementation.

## 2. Data Model

### New table: `shopping_list_items`

Copy display data at add-time rather than joining live — this decouples the shopping list from the scheme/plant lookup lifecycle.

| column | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid fk | owner, RLS scoped |
| `scheme_id` | uuid fk, nullable | `ON DELETE SET NULL` — scheme deletion never breaks this row |
| `species` | text | copied at add-time |
| `cultivar` | text, nullable | copied at add-time |
| `common_names` | text[] | copied at add-time |
| `thumbnail_storage_path` | text | snapshotted into Supabase Storage at add-time (see §4) |
| `wikimedia_attribution` | text, nullable | carried through so it can be copied onto the plant record if purchased-and-added |
| `created_at` | timestamptz | |

- "Originating scheme" link: if `scheme_id IS NULL`, render "This planting scheme has been deleted" instead of a link. No separate existence check needed — the FK's `ON DELETE SET NULL` makes this a simple null check.

### `plants` table additions

| column | type | notes |
|---|---|---|
| `image_source` | text | `'wikimedia'` \| `'upload'`. Backfill existing rows to `'wikimedia'`. |
| `image_attribution` | text, nullable | Only populated/displayed when `image_source = 'wikimedia'` |

- Attribution UI on the plant card renders only when `image_source = 'wikimedia'` AND `image_attribution` is not null.
- The existing "replace image" path (wherever a user uploads their own plant photo) must be updated to set `image_source = 'upload'` and clear `image_attribution` in the same update — the two fields should never be set independently of each other.

## 3. Image Snapshotting

- At add-to-shopping-list time, snapshot the Wikimedia image into Supabase Storage (do not rely on the live proxy for shopping list thumbnails — known 404 issue). Store the resulting path in `thumbnail_storage_path`.
- This is scoped to shopping list items and any plant created via purchase — **not** a full retroactive fix for existing plant detail pages (that remains separately deferred per existing notes).
- On purchase-and-add-to-garden, copy/move the already-snapshotted image into the plant's storage location rather than re-fetching from Wikimedia.

## 4. Shopping List Page

Simple list view per item:
- Thumbnail (from `thumbnail_storage_path`)
- Species, cultivar, common name(s)
- Link to originating scheme, or "This planting scheme has been deleted" if `scheme_id IS NULL`
- Two actions per item: **Delete** (hard delete) and **Purchased**

### Delete
- Hard delete the row and its associated storage snapshot file.

### Purchased flow
1. User taps "Purchased."
2. Prompt: "Do you want to add this to your garden?"
   - **Yes**: create a `plants` record — species, cultivar, common_names, snapshotted image copied into plant storage, `image_source = 'wikimedia'`, `image_attribution` copied from the shopping list row. No scheme reference stored on the plant. Delete the shopping list item.
   - **No**: delete the shopping list item only, no plant record created.
3. Either path removes the item from the shopping list.

---

## Explicitly Deferred (GitHub issues)

- Additional entry points to add items to the shopping list.
- Seasonal "best time to shop for this" notes.
- "Similar plant" alternative suggestions when unavailable.
