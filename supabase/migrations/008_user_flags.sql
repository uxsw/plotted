CREATE TABLE user_flags (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_lookup_enabled boolean NOT NULL DEFAULT false
);

ALTER TABLE user_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own flags"
  ON user_flags FOR SELECT
  USING (auth.uid() = user_id);
