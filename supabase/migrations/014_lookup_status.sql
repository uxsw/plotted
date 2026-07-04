ALTER TABLE plants ADD COLUMN lookup_status text;

ALTER TABLE plants ADD CONSTRAINT plants_lookup_status_check
  CHECK (lookup_status IN ('skipped', 'success', 'not_found', 'error'));
