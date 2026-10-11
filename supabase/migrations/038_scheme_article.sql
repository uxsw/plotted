-- The scheme page's structured write-up, and planting a scheme out.
--
-- `schemes.article` holds the short, typed pieces the page sets as figures and
-- lists (lib/scheme-article.ts): the key idea, at-a-glance facts, a note per
-- tier, pairings, and jobs through the year. Null for the /schemes/new form
-- journey and for anything saved before this; those render from
-- narrative_intro / narrative_body as before.
--
-- Apply this before deploying the code that writes these columns: the
-- conversational save inserts them, and an insert naming a missing column
-- fails the whole scheme.

alter table schemes
  add column article jsonb;

alter table scheme_suggestions
  -- A word-picture of the plant, shown large when there is no photograph.
  add column look text,
  -- The care tip, split out of `why` (which is now the plant's role only).
  add column care text,
  add column flower_colour text
    check (flower_colour in (
      'white', 'cream', 'yellow', 'orange', 'red',
      'pink', 'purple', 'blue', 'green', 'bronze'
    )),
  -- The gardener's own plant: set at save for a plant already in their garden,
  -- or when a plant is marked as planted from the scheme page.
  add column plant_id uuid references plants(id) on delete set null,
  add column planted_at timestamptz;
