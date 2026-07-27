-- Photo identification (stage 1: schema only).
-- Adds identification_status and the column for the user's original,
-- pre-normalisation species input. See docs/photo-lookup/spec_1.md.

-- Safety check: identification_status defaults every existing row to
-- 'identified', and the consistency constraint below only constrains
-- 'unidentified' rows, so no existing row can violate it regardless of
-- its current species value. This DO block re-confirms that explicitly
-- rather than relying on that reasoning alone.
DO $$
DECLARE
  bad_count integer;
BEGIN
  SELECT count(*) INTO bad_count FROM plants WHERE species IS NULL;
  IF bad_count > 0 THEN
    RAISE NOTICE 'plants has % row(s) with null species; all will default to identification_status = identified, which is unaffected by this.', bad_count;
  END IF;
END $$;

ALTER TABLE plants
  ADD COLUMN identification_status text NOT NULL DEFAULT 'identified'
  CHECK (identification_status IN ('identified', 'unidentified'));

ALTER TABLE plants ADD COLUMN species_input text;

ALTER TABLE plants
  ADD CONSTRAINT plants_identification_status_species_check
  CHECK (identification_status <> 'unidentified' OR species IS NULL);
