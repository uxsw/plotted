-- Add status tracking to schemes so failed/in-progress attempts are persisted.
-- Part of the scheme generation failure handling feature (stage 1 of 4).

-- Add status column. Default is 'generating' for new rows created before generation runs.
alter table schemes
  add column status text not null default 'generating'
    check (status = any (array['generating', 'complete', 'failed']));

-- All pre-existing rows completed successfully (proved by their NOT NULL narrative columns).
update schemes set status = 'complete';

-- Relax NOT NULL on fields that are only populated after successful AI generation.
alter table schemes alter column name drop not null;
alter table schemes alter column narrative_intro drop not null;
alter table schemes alter column narrative_body drop not null;

-- Note: scheme_source_plants.plant_id already has ON DELETE SET NULL from migration 012.
-- No FK change needed here.
