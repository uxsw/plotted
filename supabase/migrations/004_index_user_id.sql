-- Postgres does not auto-index FK columns on the referencing side.
-- This index supports the primary query pattern: filtering plants by the
-- authenticated user (user_id = auth.uid()), which every RLS policy uses.
CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id);
