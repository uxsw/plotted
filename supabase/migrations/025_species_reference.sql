CREATE TABLE species_reference (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  genus                 text,
  species               text,
  cultivar              text,
  match_key             text        NOT NULL UNIQUE,
  frost_tolerance_c     int4,
  frost_tolerance_notice text,
  lookup_status         text        CHECK (lookup_status IN ('pending', 'complete', 'failed')),
  last_validated_at     timestamptz,
  validation_status     text        DEFAULT 'unreviewed',
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- Read access open to all authenticated users; writes via service role only.
ALTER TABLE species_reference ENABLE ROW LEVEL SECURITY;

CREATE POLICY "species_reference_read"
  ON species_reference
  FOR SELECT
  TO authenticated
  USING (true);
