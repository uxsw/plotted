-- Shopping list items table and plants image-tracking columns.
-- See docs/specs/shopping-list.md §2.

create table shopping_list_items (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  scheme_id              uuid references schemes(id) on delete set null,
  species                text not null,
  cultivar               text,
  common_names           text[],
  thumbnail_storage_path text not null,
  wikimedia_attribution  text,
  created_at             timestamptz not null default now()
);

create index idx_shopping_list_items_user_id on shopping_list_items(user_id);

alter table shopping_list_items enable row level security;

create policy "Users can view their own shopping list items"
  on shopping_list_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own shopping list items"
  on shopping_list_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own shopping list items"
  on shopping_list_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own shopping list items"
  on shopping_list_items for delete
  using (auth.uid() = user_id);

-- Plants: image provenance tracking.
alter table plants
  add column image_source      text check (image_source in ('wikimedia', 'upload')),
  add column image_attribution text;

update plants set image_source = 'wikimedia';
