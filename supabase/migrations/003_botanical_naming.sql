-- Replace species_name (single free-text field) with structured botanical naming:
-- genus (required), species (optional), cultivar (optional).
-- A generated tsvector column covers all four name fields for full-text search.

-- Add new columns
ALTER TABLE plants ADD COLUMN genus   text NOT NULL DEFAULT '';
ALTER TABLE plants ADD COLUMN species  text;
ALTER TABLE plants ADD COLUMN cultivar text;

-- Drop the old column (data loss acceptable — pre-launch)
ALTER TABLE plants DROP COLUMN species_name;

-- Remove the temporary default now that any existing rows have been handled
ALTER TABLE plants ALTER COLUMN genus DROP DEFAULT;

-- Generated full-text search vector across all name fields
ALTER TABLE plants ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english',
    genus || ' ' ||
    coalesce(species, '') || ' ' ||
    coalesce(cultivar, '') || ' ' ||
    coalesce(common_name, '')
  )
) STORED;

CREATE INDEX plants_search_vector_idx ON plants USING GIN (search_vector);
