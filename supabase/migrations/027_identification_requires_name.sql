-- Photo identification (stage 5): a record outside identification_status =
-- 'unidentified' must carry at least a genus or a species. Only the
-- unidentified state may have neither — that's the one point on the spectrum
-- where "no name at all" is a deliberate save rather than an incomplete one.
-- See docs/photo-lookup/spec_1.md.
--
-- Safety check: confirmed via direct query before writing this migration
-- that zero existing rows have genus = '' AND species IS NULL, so no
-- existing 'identified' row can violate this.
DO $$
DECLARE
  bad_count integer;
BEGIN
  SELECT count(*) INTO bad_count
  FROM plants
  WHERE identification_status <> 'unidentified'
    AND species IS NULL
    AND genus = '';
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'plants has % row(s) with no genus or species but identification_status <> unidentified; resolve before applying this constraint', bad_count;
  END IF;
END $$;

ALTER TABLE plants
  ADD CONSTRAINT plants_identified_requires_name_check
  CHECK (identification_status = 'unidentified' OR species IS NOT NULL OR genus <> '');
