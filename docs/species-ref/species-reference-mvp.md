# Species Reference — Shared Enrichment Cache

**Status:** Draft for review
**Depends on / blocks:** Dashboard weather-card frost warning feature
**Related tables:** `plants`, `species` (bird/wildlife reference — unrelated, name collision only)

---

## Problem

`plants` is currently a fully per-user table. `genus`, `species`, `cultivar` etc. live directly on each user's plant row with no shared reference between users. This means any per-species enrichment (starting with frost tolerance) would require a redundant AI lookup for every user who plants the same species — cost scales linearly with users instead of with unique species, and gets worse as the user base grows.

## Goal

Introduce a shared, cached reference table for species-level enrichment data, looked up once per unique species and reused across all users, without disrupting the existing per-user `plants` table or its current lookup/auto-correct behaviour.

## Non-goals (this spec)

- Migrating `plants.genus/species/cultivar` into a hard foreign key relationship. This remains a soft lookup by normalized tuple, not a schema-enforced relation. A full normalization migration is a larger, separate piece of work and isn't required to unlock the frost-tolerance feature.
- Building the periodic re-validation job or admin review queue described below. Only the *supporting schema* for this is included now; the job itself is deferred (see "Deferred: validation routine").
- Expanding enrichment beyond frost tolerance. Heat tolerance, wind/rain tolerance, and wildlife affinity are explicitly out of scope for this pass — tracked as future GitHub issues once frost tolerance has proven the pattern out.

---

## New table: `species_reference`

| Name | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | Primary | |
| `genus` | `text` | | |
| `species` | `text` | Nullable | |
| `cultivar` | `text` | Nullable | |
| `match_key` | `text` | Unique, not null | Normalized lowercase concatenation of genus/species/cultivar, used for lookup — see Matching below |
| `frost_tolerance_c` | `int4` | Nullable | Estimated minimum tolerance in °C |
| `frost_tolerance_notice` | `text` | Nullable | Short hedge copy shown alongside the value, e.g. "Estimated tolerance" |
| `lookup_status` | `text` | | Mirrors the existing `plants.lookup_status` pattern (pending / complete / failed) |
| `last_validated_at` | `timestamptz` | Nullable | Not used by any active job yet — reserved for the deferred validation routine |
| `validation_status` | `text` | Nullable | Reserved: `unreviewed` / `confirmed` / `flagged`. Defaults to `unreviewed`, unused otherwise for now |
| `created_at` | `timestamptz` | | |
| `updated_at` | `timestamptz` | | |

This table is intentionally a **sibling** to `plants`, not a foreign key target. `plants` is not modified in this pass.

### Matching

`match_key` reuses the existing normalization/auto-correct logic that already backs the "did you mean" silent auto-correct on `plants.genus/species/cultivar`, rather than introducing a second, parallel normalization scheme. This matters because fuzzy matching quality directly determines cache hit rate — if two spellings of the same plant normalize differently, you silently get duplicate reference rows instead of a shared cache entry.

## Enrichment flow

1. On plant add/edit (after existing genus/species/cultivar auto-correct resolves), compute `match_key`.
2. Look up `species_reference` by `match_key`.
   - **Hit:** use the cached `frost_tolerance_c` directly. No AI call.
   - **Miss:** create a `pending` row, fire a background enrichment call (same non-blocking `after()` pattern as scheme generation), populate on completion.
3. Plant card and weather-card frost warning read from `species_reference` via the same `match_key` computed from the plant's own genus/species/cultivar — no join required, since this is a lookup, not a relation.

## Display

Frost tolerance shown on the plant card using the same soft-hedge treatment as `AiNoticePanel` — framed as an estimate, not a stated fact, consistent with how scheme suggestions are already presented. No new design pattern needed here, just reuse.

---

## Deferred: validation routine

Flagged as a real risk worth designing for, but not building yet — there's no data yet on actual AI error rate to justify the cost of building it now.

**Why not a simple periodic re-ask:** re-querying the same model periodically isn't validation against ground truth, it's a second independent sample from the same generative process. Without an external reference, there's no way to know whether a disagreement between the old and new value is a correction or a corruption. A cron job that reruns the same lookup and overwrites on a schedule risks silently degrading accuracy over time rather than improving it.

**What a future version of this should do instead** (tracked as a GitHub issue, not built now):

- Never auto-overwrite. A re-check produces a *proposed* value, not a replacement.
- Only surface genuine disagreements between the stored value and a fresh check — agreement produces no action, no noise.
- Route disagreements to a human review queue (extension of the existing `/admin/feedback` admin surface), one-click accept/reject, rather than automatic correction.
- Prefer an independent authoritative source (e.g. RHS hardiness ratings) over a second AI opinion where one is available, since frost tolerance is a higher-stakes field than something like flowering season — a wrong frost tolerance can cost a user a plant, a wrong flowering month is a minor annoyance. Different fields may warrant different scrutiny.
- Keep provenance: `last_validated_at` plus either an append-only history log or a JSON history column, so any correction is traceable rather than silently overwriting.

The columns reserved for this (`last_validated_at`, `validation_status`) exist now so this doesn't require a schema migration later — but no job, queue, or logic consumes them yet.

**GitHub issue to raise:** "Periodic species_reference validation — revisit once species_reference has enough entries to sample error rate manually."

---

## Effort estimate

| Piece | Effort |
|---|---|
| `species_reference` migration (including reserved validation columns) | Low |
| Matching/normalization reuse | Low |
| Enrichment flow (background lookup, cache hit/miss) | Medium |
| Plant card display (reusing `AiNoticePanel` pattern) | Low |
| Validation routine + admin review queue | Deferred — not estimated in this pass |

## Out of scope / explicitly deferred (tracked as issues)

- Heat tolerance, wind/rain tolerance, wildlife affinity enrichment fields
- Hard FK normalization of `plants` against `species_reference`
- Periodic validation job and admin review queue
