-- Photo identification (final stage): choice logging + daily abuse-protection
-- counter. See docs/photo-lookup/spec_1.md.

-- Choice logging. Purely a write-and-forget dataset for a single future
-- decision (is Pl@ntNet good enough, or is Plant.id worth paying for) — no
-- UI, no reporting view, not a feedback loop. Two data columns beyond the
-- standard id/user_id/created_at: what ranked first, and what the user
-- actually picked (null = "none of these").
CREATE TABLE identification_choices (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_ranked text        NOT NULL,
  selected     text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE identification_choices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own identification choices"
  ON identification_choices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No SELECT policy — this is a write-only log from the client's perspective.
-- John reads it directly via the Supabase dashboard / service role for the
-- two-week review, per spec. No app code ever queries it back.

-- Daily identification counter. Abuse protection at private-beta scale, not
-- a quota system: identify_count_date tracks which calendar day the count
-- belongs to, so a day rollover is a plain reset rather than needing a cron
-- job or scheduled cleanup.
ALTER TABLE user_flags
  ADD COLUMN identify_count integer NOT NULL DEFAULT 0,
  ADD COLUMN identify_count_date date;
