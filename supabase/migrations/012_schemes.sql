-- Companion planting: schemes, their source plants, and AI-generated suggestions.
-- Stage 1 of the companion planting feature (see docs/companion-planting-spec.md).

create table schemes (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name                 text not null,
  space                text not null check (space in ('small', 'medium', 'large')),
  successional         boolean not null default true,
  edible               boolean not null default false,
  narrative_intro      text not null,
  narrative_body       text not null,
  featured_plant_latin text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger schemes_updated_at
  before update on schemes
  for each row execute function update_updated_at();

-- Plants the user selected from their library to generate the scheme.
create table scheme_source_plants (
  id          uuid primary key default gen_random_uuid(),
  scheme_id   uuid not null references schemes(id) on delete cascade,
  plant_id    uuid references plants(id) on delete set null,
  sort_order  integer not null default 0
);

-- AI-generated plant suggestions attached to a scheme.
create table scheme_suggestions (
  id                    uuid primary key default gen_random_uuid(),
  scheme_id             uuid not null references schemes(id) on delete cascade,
  common_name           text not null,
  latin_name            text not null,
  tier                  text not null check (tier in ('back', 'mid', 'ground')),
  height_cm             integer,
  flowering_months      integer[],
  why                   text not null,
  wildlife_value        boolean not null default false,
  drought_tolerant      boolean not null default false,
  edible                boolean not null default false,
  british_native        boolean not null default false,
  wikimedia_image_url   text,
  wikimedia_attribution text,
  -- Defaults to true: all suggestions are saved when the scheme is created.
  -- Dismissing a suggestion sets this to false rather than deleting the row.
  saved                 boolean not null default true,
  sort_order            integer not null default 0
);

-- Postgres does not auto-index FK columns on the referencing side.
-- These support the RLS ownership checks below, which join through scheme_id.
create index idx_schemes_user_id on schemes(user_id);
create index idx_scheme_source_plants_scheme_id on scheme_source_plants(scheme_id);
create index idx_scheme_suggestions_scheme_id on scheme_suggestions(scheme_id);

-- RLS
alter table schemes enable row level security;
alter table scheme_source_plants enable row level security;
alter table scheme_suggestions enable row level security;

create policy "Users can view their own schemes"
  on schemes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own schemes"
  on schemes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own schemes"
  on schemes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own schemes"
  on schemes for delete
  using (auth.uid() = user_id);

create policy "Users can view their own scheme source plants"
  on scheme_source_plants for select
  using (
    exists (
      select 1 from schemes
      where schemes.id = scheme_source_plants.scheme_id
        and schemes.user_id = auth.uid()
    )
  );

create policy "Users can insert their own scheme source plants"
  on scheme_source_plants for insert
  with check (
    exists (
      select 1 from schemes
      where schemes.id = scheme_source_plants.scheme_id
        and schemes.user_id = auth.uid()
    )
  );

create policy "Users can delete their own scheme source plants"
  on scheme_source_plants for delete
  using (
    exists (
      select 1 from schemes
      where schemes.id = scheme_source_plants.scheme_id
        and schemes.user_id = auth.uid()
    )
  );

create policy "Users can view their own scheme suggestions"
  on scheme_suggestions for select
  using (
    exists (
      select 1 from schemes
      where schemes.id = scheme_suggestions.scheme_id
        and schemes.user_id = auth.uid()
    )
  );

create policy "Users can insert their own scheme suggestions"
  on scheme_suggestions for insert
  with check (
    exists (
      select 1 from schemes
      where schemes.id = scheme_suggestions.scheme_id
        and schemes.user_id = auth.uid()
    )
  );

create policy "Users can update their own scheme suggestions"
  on scheme_suggestions for update
  using (
    exists (
      select 1 from schemes
      where schemes.id = scheme_suggestions.scheme_id
        and schemes.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from schemes
      where schemes.id = scheme_suggestions.scheme_id
        and schemes.user_id = auth.uid()
    )
  );
