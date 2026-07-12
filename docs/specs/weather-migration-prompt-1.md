# Claude Code Prompt: Weather Feature — Migration (Stage 1 of 4)

## Context

Plotted is adding a weather forecast feature (spec: `docs/specs/weather-feature.md`). This is Stage 1 of 4: the database migration only. Location resolution, the fetch/cache logic, and the UI component are separate later stages — do not build them here.

We're adding location data to the garden table so a garden's weather can be looked up. Plotted is single-garden-per-user, so location lives on the garden record (not the user record) — this keeps the data model correct if multi-garden support is ever added later, without requiring rework then.

## Pre-flight checks

Before writing the migration:

1. Look at the existing garden table definition (check prior migrations in `supabase/migrations/` for its current schema) and confirm exact table name and existing column naming conventions (e.g. snake_case, any prefixing patterns).
2. Look at the most recent 2–3 migration files in `supabase/migrations/` to confirm the sequential naming convention (filename format, numbering) and general style (comments, transaction wrapping, etc.) used in this project, and follow it exactly.
3. Confirm whether RLS policies already exist on the garden table. If they do, this migration should not need to change them — we're adding columns to an existing row, not a new table — but flag it in your summary if anything about the existing RLS looks like it would need updating for this change.

## Changes

Add a new migration that adds three **nullable** columns to the garden table:

- `latitude` — numeric type suitable for coordinate storage
- `longitude` — numeric type suitable for coordinate storage
- `location_label` — text, human-readable location name (e.g. "Exeter, Devon, UK")

No default values. No backfill — existing rows should simply have `NULL` in these columns until a user sets a location (handled in a later stage, not this one).

## Do not

- Do not touch any other tables.
- Do not modify existing RLS policies unless your pre-flight check reveals a genuine gap (if so, stop and flag it rather than making the change).
- Do not write any application code, API routes, or components — this stage is the migration only.
- Do not add seed data or default coordinates in the migration itself (the Exeter fallback is application-level logic for a later stage).
- Do not rename or alter any existing garden table columns.

## Effort estimate

Low.

## Deliverable format

- One new SQL migration file in `supabase/migrations/`, following the existing sequential naming and style conventions found in pre-flight step 2.
- A brief summary of: the exact filename/path used, the column definitions added, and confirmation of whether any RLS follow-up is needed.
