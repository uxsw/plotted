-- Add per-user shopping list feature-introduction notice timestamp.
-- user_flags is keyed on user_id (one row per user), so this is a global
-- "user has seen the notice" flag rather than per-scheme.
ALTER TABLE user_flags ADD COLUMN shopping_list_notice_seen_at timestamptz;

-- user_flags previously only had a SELECT policy; the shopping list notice
-- needs insert (first-time upsert) and update (subsequent visits) access.
CREATE POLICY "Users can insert own flags"
  ON user_flags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flags"
  ON user_flags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
