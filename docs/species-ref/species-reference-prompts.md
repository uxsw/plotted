# Species Reference — Staged Claude Code Prompts

Source spec: `docs/specs/species-ref/species-reference-mvp.md`

Run these in order. Each stage should produce a reviewable diff before moving to the next — don't chain them into one session.

---

## Stage 1 — Migration: `species_reference` table

```
Create a new Supabase migration for a `species_reference` table, following the
existing sequential numbering convention in supabase/migrations/.

Schema:
- id: uuid, primary key, default gen_random_uuid()
- genus: text, nullable
- species: text, nullable
- cultivar: text, nullable
- match_key: text, not null, unique — normalized lowercase concatenation of
  genus/species/cultivar
- frost_tolerance_c: int4, nullable
- frost_tolerance_notice: text, nullable
- lookup_status: text — mirror the existing plants.lookup_status pattern
  (check the plants table migration for the exact convention: default value,
  whether it's a check constraint or plain text)
- last_validated_at: timestamptz, nullable — reserved column, not consumed by
  any logic yet
- validation_status: text, nullable, default 'unreviewed' — reserved column,
  not consumed by any logic yet
- created_at: timestamptz, default now()
- updated_at: timestamptz, default now()

This table is a sibling to `plants`, not a foreign key target — do not add
any FK relationship between plants and species_reference in this migration.

RLS: this table is shared/global reference data, not per-user. Read access
should be open to all authenticated users. Writes should only happen via the
service role (server-side enrichment calls), not client-side — no insert/
update policy for regular authenticated users.

Do not modify the plants table in this migration.

After writing the migration, do not apply it — I'll apply it manually per
our usual process. Show me the migration file content and stop.
```

**Effort:** Low
**Review focus:** column types match the spec table exactly, RLS matches "read-open, write-service-role-only," `lookup_status` convention actually matches what `plants` does rather than guessing.

---

## Stage 2 — Matching / normalization reuse

```
I need to compute a match_key for species_reference lookups, reusing the
existing normalization/auto-correct logic that already backs the "did you
mean" silent auto-correct on plants.genus/species/cultivar.

First, find and show me the existing normalization function(s) used for
plant genus/species/cultivar auto-correct — I want to confirm we're reusing
the same logic rather than writing a second normalization scheme.

Then add a small utility function computeSpeciesMatchKey(genus, species,
cultivar) that:
- Runs each field through the existing normalization logic
- Lowercases and concatenates them into a single match_key string
- Handles null/empty species or cultivar consistently (define and document
  the convention — e.g. empty string vs omitted segment — since this needs
  to be stable so the same plant always produces the same match_key)

Place this wherever similar lookup utilities currently live in the codebase
(match existing file structure, don't invent a new location).

Add a short comment explaining that fuzzy-matching quality here directly
determines cache hit rate, and two spellings normalizing differently will
silently create duplicate reference rows.

No AI calls, no database writes in this stage — just the pure function.
Show me the diff.
```

**Effort:** Low
**Review focus:** it actually found and reused the existing normalization, didn't reimplement something similar-but-different. Null-handling convention is explicit and sane.

---

## Stage 3 — Enrichment flow (background lookup, cache hit/miss)

```
Implement the species_reference enrichment flow described in
docs/specs/species-ref/species-reference-mvp.md.

On plant add/edit, after the existing genus/species/cultivar auto-correct
resolves:

1. Compute match_key using computeSpeciesMatchKey from stage 2.
2. Look up species_reference by match_key.
   - Hit: use the cached frost_tolerance_c directly, no AI call.
   - Miss: create a species_reference row with lookup_status='pending',
     then fire a background enrichment call using the same non-blocking
     after() pattern already used for scheme generation. On completion,
     populate frost_tolerance_c, frost_tolerance_notice, and set
     lookup_status='complete' (or 'failed' if the AI call fails — match
     whatever failure handling convention plants.lookup_status already uses).

The AI lookup itself should ask for a frost tolerance estimate in °C plus a
short hedge notice string (e.g. "Estimated tolerance") — reuse the existing
Anthropic API call setup/client used for the existing plant lookup, don't
create a second one.

This must not block the plant add/edit response — same pattern as scheme
generation's background call.

Do not add any join between plants and species_reference. The lookup is by
match_key computed independently on each read, not a stored foreign key.

Do not touch plants table writes/reads beyond computing match_key from the
already-resolved genus/species/cultivar.

Show me the diff before wiring it into any UI.
```

**Effort:** Medium
**Review focus:** non-blocking is actually non-blocking (no await stalling the response), pending-row race handled sensibly if two users add the same new species near-simultaneously, reuses existing AI client rather than a new one.

---

## Stage 4 — Plant card + frost warning display

```
Add frost tolerance display to the plant card and (if the weather-card
dashboard component already exists) the frost warning integration.

Plant card: show frost_tolerance_c read live from species_reference via
match_key computed from the plant's own genus/species/cultivar — no stored
join, compute match_key and query on render/load.

Display treatment: reuse the existing AiNoticePanel soft-hedge pattern
already used for scheme suggestions — this is an estimate, not a stated
fact. Don't invent a new visual treatment.

Handle all species_reference states in the UI:
- No row yet (never looked up) — don't show anything alarming, this is a
  normal state for a brand new species
- lookup_status='pending' — subtle loading/pending state, consistent with
  how plants.lookup_status pending is currently shown elsewhere
- lookup_status='complete' with frost_tolerance_c present — show the value
  with the AiNoticePanel hedge treatment
- lookup_status='failed' — fail quietly, don't show a broken/error state on
  the plant card

If the weather-card dashboard frost warning component already exists, wire
it to the same species_reference lookup for the plants in the user's
garden. If it doesn't exist yet, skip that part and just do the plant card
— flag that back to me rather than building the dashboard card here.

Show me the diff.
```

**Effort:** Low
**Review focus:** all four lookup_status states are actually handled (easy to forget the "no row yet" and "failed" cases and only build the happy path), no new visual pattern invented, dashboard wiring correctly skipped/flagged if not ready rather than half-built.

---

## Notes for all stages

- Each stage should be run and reviewed independently — don't let Claude Code chain straight from Stage 1 into Stage 2 without you looking at the diff first.
- Stage 1's migration should be applied manually by you per the existing process, not auto-applied — worth double-checking it actually lands correctly given the earlier migration-018 issue on the testing project.
- None of these stages touch `plants` table schema or the validation/review-queue work — that's correctly out of scope per the spec.
