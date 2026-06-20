-- Plants table
create table if not exists plants (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  common_name            text not null,
  species_name           text,                      -- normalized: lowercase, trimmed
  date_planted           date,                      -- day always stored as 1; display month+year only
  photo_url              text,
  location               text,                      -- free-text; future-proofed for FK to locations table
  sun_needs              text check (sun_needs in ('full sun', 'partial shade', 'full shade')),
  flowering_season_from  integer check (flowering_season_from between 1 and 12),
  flowering_season_to    integer check (flowering_season_to between 1 and 12),
  eventual_height_cm     integer,
  eventual_spread_cm     integer,
  purchased_from         text,
  status                 text not null default 'active' check (status in ('active', 'removed')),
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger plants_updated_at
  before update on plants
  for each row execute function update_updated_at();

-- RLS
alter table plants enable row level security;

create policy "Users can view their own plants"
  on plants for select
  using (auth.uid() = user_id);

create policy "Users can insert their own plants"
  on plants for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own plants"
  on plants for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own plants"
  on plants for delete
  using (auth.uid() = user_id);

-- Storage bucket for plant photos (run this in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('plant-photos', 'plant-photos', true);
--
-- Storage RLS policies (also set via dashboard):
-- Allow authenticated users to upload to their own folder:
--   (bucket_id = 'plant-photos') AND (auth.uid()::text = (storage.foldername(name))[1])
-- Allow public read of all photos (so photo_url works in <img> tags without auth):
--   bucket_id = 'plant-photos'
