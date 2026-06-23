-- Add 'full sun / partial shade' to the sun_needs check constraint.
ALTER TABLE plants DROP CONSTRAINT IF EXISTS plants_sun_needs_check;

ALTER TABLE plants ADD CONSTRAINT plants_sun_needs_check
  CHECK (sun_needs IN ('full sun', 'full sun / partial shade', 'partial shade', 'full shade'));
