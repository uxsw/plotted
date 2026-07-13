create table user_species_sightings (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  species_id  uuid        not null references species(id) on delete cascade,
  spotted_at  timestamptz not null default now(),
  unique (user_id, species_id)
);

create index idx_user_species_sightings_user_id on user_species_sightings(user_id);

alter table user_species_sightings enable row level security;

create policy "Users can view their own sightings"
  on user_species_sightings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sightings"
  on user_species_sightings for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own sightings"
  on user_species_sightings for delete
  using (auth.uid() = user_id);
