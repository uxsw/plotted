-- Manual shopping list items, plus the columns the Phase 2 background lookup
-- will fill in. See docs/specs/shopping-list-manual-add.md §1.

alter table shopping_list_items
  add column source              text not null default 'scheme'
    check (source in ('scheme', 'manual')),
  -- What the user typed or dictated. Never overwritten by lookup.
  add column entered_name        text,
  add column notes               text,
  add column where_to_buy        text,
  -- Everything below is written by the Phase 2 lookup only. Null for scheme
  -- items, and null for a manual item no lookup has been started for yet:
  -- capture inserts with lookup_status null, and the lookup sets 'pending'
  -- (with lookup_requested_at) at the moment it starts.
  add column genus               text,
  add column summary             text,
  add column summary_scope       text
    check (summary_scope in ('cultivar', 'species', 'genus')),
  add column lookup_confidence   text
    check (lookup_confidence in ('high', 'medium', 'low')),
  add column growth_type         text,
  add column lookup_status       text
    check (lookup_status in ('pending', 'complete', 'not_found', 'failed')),
  add column lookup_requested_at timestamptz;

-- The NOT NULL default above already backfills existing rows; this is here so
-- the backfill is explicit rather than a side effect of the column default.
update shopping_list_items set source = 'scheme' where source is distinct from 'scheme';

-- A manual item has only what the user typed until a lookup resolves it.
alter table shopping_list_items alter column species drop not null;

alter table shopping_list_items
  add constraint shopping_list_items_name_present
  check (species is not null or entered_name is not null);
