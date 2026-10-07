-- Shopping list name lookup (docs/specs/shopping-list-manual-add.md §3).
--
-- When the lookup finds plausible plants but isn't confident which one the
-- user meant, the candidates are kept here until the user picks one or
-- keeps the name as typed. Null otherwise: for scheme items, for confident
-- matches (whose fields are written straight to the row), and once the
-- user has chosen.
--
-- A JSON array of up to 3 objects:
--   { genus, species, cultivar, common_names, growth_type, unmatched_text }
-- The existing per-user RLS policies cover the new column.

alter table shopping_list_items
  add column lookup_candidates jsonb;
