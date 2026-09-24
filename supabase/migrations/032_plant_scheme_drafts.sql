-- Conversational planting scheme drafts (/plant-scheme).
-- Wholly separate from the old `schemes` tables — no shared rows or code path.
--
-- One row per in-progress conversation, created when the question flow
-- completes. `path`/`phase` are real columns for later hub filtering; the rest
-- of the client state (transcript, scheme list, question outcomes, …) lives in
-- `state` while its shape is still evolving. Later lifecycle fields
-- (status, expiry) are expected to arrive as new columns, not inside `state`.

create table plant_scheme_drafts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  path        text not null check (path in ('existing', 'scratch')),
  phase       text not null default 'questions' check (phase in ('questions', 'scheme')),
  state       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger plant_scheme_drafts_updated_at
  before update on plant_scheme_drafts
  for each row execute function update_updated_at();

create index idx_plant_scheme_drafts_user_id on plant_scheme_drafts(user_id);

alter table plant_scheme_drafts enable row level security;

create policy "Users can view their own plant scheme drafts"
  on plant_scheme_drafts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own plant scheme drafts"
  on plant_scheme_drafts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own plant scheme drafts"
  on plant_scheme_drafts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own plant scheme drafts"
  on plant_scheme_drafts for delete
  using (auth.uid() = user_id);
