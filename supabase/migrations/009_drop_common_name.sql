-- Drop the generated column and index that depend on common_name, then drop
-- common_name, then recreate search_vector without it.
-- common_names (text[]) is excluded from search_vector because array_to_string
-- is STABLE not IMMUTABLE and cannot be used in a generated column expression.
-- Client-side search in PlantGrid covers common_names directly.

DROP INDEX IF EXISTS plants_search_vector_idx;
ALTER TABLE plants DROP COLUMN search_vector;
ALTER TABLE plants DROP COLUMN common_name;

ALTER TABLE plants ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english',
    genus || ' ' ||
    coalesce(species, '') || ' ' ||
    coalesce(cultivar, '')
  )
) STORED;

CREATE INDEX plants_search_vector_idx ON plants USING GIN (search_vector);
