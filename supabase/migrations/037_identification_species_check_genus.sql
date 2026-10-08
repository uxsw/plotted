-- Brings the repo in line with production, and makes the check NULL-safe.
--
-- Production's plants_identification_status_species_check already carries a
-- genus clause that migration 026 never had:
--
--   identification_status <> 'unidentified' OR (species IS NULL AND genus = '')
--
-- (read from pg_constraint on 2026-10-08; it was changed by hand at some
-- point after 026). 026 in this repo only says "species IS NULL", so a fresh
-- database built from migrations was looser than live.
--
-- This migration defines the constraint as live has it, with one defensive
-- change: COALESCE(genus, '') = '' instead of genus = ''. genus is NOT NULL
-- today, so the two behave identically; the COALESCE only matters if that
-- ever changes, where "genus = ''" would evaluate to NULL and let the row
-- through. Blank genus is '' everywhere in the app; NULL is treated as blank.
--
-- Safe to run on production (replaces the constraint with an equivalent one)
-- and on a database that only has 026's version (tightens it; the check
-- below fails loudly first if any row would violate it).
DO $$
DECLARE
  bad_count integer;
BEGIN
  SELECT count(*) INTO bad_count
  FROM plants
  WHERE identification_status = 'unidentified'
    AND NOT (species IS NULL AND COALESCE(genus, '') = '');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'plants has % unidentified row(s) with a species or a genus; resolve before applying this constraint', bad_count;
  END IF;
END $$;

ALTER TABLE plants DROP CONSTRAINT IF EXISTS plants_identification_status_species_check;

ALTER TABLE plants
  ADD CONSTRAINT plants_identification_status_species_check
  CHECK (identification_status <> 'unidentified' OR (species IS NULL AND COALESCE(genus, '') = ''));
