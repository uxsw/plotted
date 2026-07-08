STAGE 1 of 4 — Schema migration for scheme generation failure handling

Reference spec: docs/specs/scheme-generation-failure-handling.md
(read this first for full context — this prompt covers only the
migration described in "Schema changes")

CONTEXT
Today a `schemes` row only gets created after AI generation succeeds,
so failures leave no trace and can't be retried. This stage lays the
schema groundwork only — no application code changes yet.

CHANGES
1. New migration file (follow existing numbering convention in
   supabase/migrations/):
   - `ALTER TABLE schemes ADD COLUMN status text NOT NULL DEFAULT
     'generating' CHECK (status = ANY (ARRAY['generating', 'complete',
     'failed']));`
   - Backfill existing rows: since every existing scheme already
     completed successfully (the NOT NULL narrative columns prove
     it), set `status = 'complete'` for all pre-existing rows as part
     of the migration.
   - Relax constraints: drop `NOT NULL` on `schemes.name`,
     `schemes.narrative_intro`, `schemes.narrative_body`.
   - Change the foreign key on `scheme_source_plants.plant_id` →
     `plants.id` to `ON DELETE SET NULL` (drop and recreate the
     constraint with the new action).

PRE-FLIGHT CHECKS (do before writing the migration, report back)
1. Confirm the exact current constraint name for the
   scheme_source_plants → plants foreign key (check the migration
   history or introspect the schema) so it can be dropped cleanly.
2. Search the codebase (TypeScript types, component prop types,
   anywhere reading `scheme.name` / `narrative_intro` /
   `narrative_body`) for places that assume these fields are always
   present (e.g. `scheme.name.toUpperCase()` with no null check). List
   what you find — don't fix them in this stage, just report so we
   know what stage 2/3 needs to handle.
3. Confirm whether `lib/types.ts` (or wherever the `Scheme` interface
   lives) needs `name`, `narrative_intro`, `narrative_body` marked
   optional (`string | null`) to match. Update the type in this stage
   since it's a direct consequence of the migration, but don't touch
   any component logic yet.

DO NOT
- Change the scheme creation/generation flow itself (that's stage 2).
- Change the landing page or any card UI (stage 3).
- Change plant deletion behaviour (stage 4).
- Fix any null-safety issues found in the pre-flight search — just
  report them.

EFFORT ESTIMATE
Small — one migration file, one type update, no logic changes.

DELIVERABLE
Show the migration file, the type diff, and the pre-flight findings
list before considering this done.
