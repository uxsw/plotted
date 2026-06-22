-- Drop the location column. Any existing data is lost (accepted).
ALTER TABLE plants DROP COLUMN IF EXISTS location;
