-- Saving a conversational planting scheme (/plant-scheme) into the shared
-- `schemes` tables, so the finished scheme renders through the existing
-- /schemes/[id] page.
--
-- `schemes.draft_id` and `plant_scheme_drafts.scheme_id` deliberately point at
-- each other. draft_id lets a refresh mid-save find its in-flight scheme while
-- the draft itself stays untouched; scheme_id is set only once the save
-- succeeds, alongside status = 'saved'.

alter table schemes
  add column origin text not null default 'form'
    check (origin in ('form', 'conversation')),
  add column draft_id uuid references plant_scheme_drafts(id) on delete set null;

-- One scheme per draft: a retry reuses the failed row rather than piling up
-- new ones, and a double-submit can't create two.
create unique index idx_schemes_draft_id on schemes(draft_id) where draft_id is not null;

alter table plant_scheme_drafts
  add column status text not null default 'draft'
    check (status in ('draft', 'saved')),
  add column scheme_id uuid references schemes(id) on delete set null;

-- Conversation-origin source plants may have no plants row (plant_id is
-- nullable, on delete set null — see 012), so record what they were.
alter table scheme_source_plants
  add column common_name text,
  add column latin_name text;

-- A retry replaces a failed scheme's suggestions; 012 gave owners no way to
-- delete them (only the schemes-row cascade could).
create policy "Users can delete their own scheme suggestions"
  on scheme_suggestions for delete
  using (
    exists (
      select 1 from schemes
      where schemes.id = scheme_suggestions.scheme_id
        and schemes.user_id = auth.uid()
    )
  );
