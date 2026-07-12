-- Garden table.
-- One row per user (single-garden-per-user today); no unique constraint on user_id
-- so the model extends to multi-garden without rework.
-- Location columns are nullable — existing users have NULL until they set a location
-- (handled in a later stage via browser geolocation or text search).

create table garden (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  latitude        double precision,
  longitude       double precision,
  location_label  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger garden_updated_at
  before update on garden
  for each row execute function update_updated_at();

create index idx_garden_user_id on garden(user_id);

alter table garden enable row level security;

create policy "Users can view their own garden"
  on garden for select
  using (auth.uid() = user_id);

create policy "Users can insert their own garden"
  on garden for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own garden"
  on garden for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own garden"
  on garden for delete
  using (auth.uid() = user_id);
