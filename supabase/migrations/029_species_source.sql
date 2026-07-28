-- Persisted signal for whether a plant's species came from photo
-- identification or manual entry — closes the gap where the retry lookup
-- route (app/api/plants/[id]/lookup/route.ts) had no way to know this for an
-- already-saved plant, unlike the initial save which gets it as a call-time
-- flag (upsertPlant's options.fromIdentification).
--
-- Text + CHECK, not a Postgres enum, matching identification_status's
-- pattern. Nullable — existing rows stay null and are treated identically to
-- 'manual' everywhere this is read (full correction/overwrite behaviour,
-- unchanged from before this column existed). No backfill: origin isn't
-- knowable for rows written before this column existed, and guessing would
-- be worse than leaving it null.
ALTER TABLE plants
  ADD COLUMN species_source text
  CHECK (species_source IN ('identification', 'manual'));
