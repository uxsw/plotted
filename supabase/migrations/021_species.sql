create table species (
  id          uuid        primary key default gen_random_uuid(),
  category    text        not null,
  name        text        not null,
  image_path  text        not null,
  description text        not null,
  sort_order  int         not null,
  created_at  timestamptz not null default now()
);

alter table species enable row level security;

create policy "Species are publicly readable"
  on species for select
  using (true);

insert into species (category, name, image_path, description, sort_order) values
  ('bird', 'Blackbird',  '/birds/blackbird.webp',  'The blackbird is a garden regular you''ll soon know by sight — sleek black feathers and a beak like an orange traffic cone (females wear brown instead). They''re always hopping about the lawn hunting worms, and can''t resist autumn berries, so cotoneaster or holly will win their loyalty. Their song is the real showstopper though — one of the prettiest in any garden.', 1),
  ('bird', 'Blue Tit',   '/birds/blue-tit.webp',   'Tiny, acrobatic and endlessly busy, the blue tit is easy to spot with its blue cap and yellow tummy. They''re huge fans of insects and caterpillars in summer, and will happily raid a feeder for seeds and peanuts the rest of the year. Put up a nest box and you might just get front-row seats to a family of them.', 2),
  ('bird', 'Chaffinch',  '/birds/chaffinch.webp',  'A splash of pink-orange on the chest and a flash of white in the wings make the chaffinch one of the prettier faces at the bird table. They''re mostly ground foragers, hopping about for seeds and fallen crumbs, though they''ll switch to insects when it''s time to feed hungry chicks. Listen for their cheerful, rattling little song.', 3),
  ('bird', 'Crow',       '/birds/crow.webp',        'Bold, brainy and impossible to ignore, the crow struts around the garden like it owns the place — which, frankly, it might. They''ll eat almost anything, from insects and worms to leftover scraps, and are famously clever, even recognising individual people. Not the shyest visitor, but always entertaining to watch.', 4),
  ('bird', 'Goldfinch',  '/birds/goldfinch.webp',   'With a bright red face and gold-striped wings, the goldfinch looks like it''s dressed for a party. They adore seeds, especially from teasel, thistle and sunflowers, and a niger seed feeder is the fastest way to win them over. Often seen in cheerful little flocks, aptly called a "charm" of goldfinches.', 5),
  ('bird', 'Magpie',     '/birds/magpie.webp',      'Sleek, black-and-white and never short of confidence, the magpie is one of the smartest birds you''ll find in a garden. They eat a bit of everything — insects, scraps, even other birds'' eggs — and are known for their curiosity, sometimes investigating anything shiny that catches their eye. Their chattering call is hard to miss.', 6),
  ('bird', 'Pigeon',     '/birds/pigeon.webp',      'Plump, calm and a little bit clumsy, the wood pigeon is a familiar sight pottering about the lawn. They mostly eat seeds, shoots and berries, and aren''t above cleaning up whatever''s fallen from the feeder above. Gentle and unbothered by much, they bring a nice bit of calm to a busy garden.', 7),
  ('bird', 'Robin',      '/birds/robin.webp',       'Britain''s favourite garden companion, the robin is easy to spot with its bright red breast and cheeky, curious nature. They love following along when you''re digging, hoping you''ll turn up a worm or grub for them. Fiercely territorial despite their friendly reputation, one robin will often claim your garden as its very own patch.', 8),
  ('bird', 'Sparrow',    '/birds/sparrow.webp',     'Small, sociable and always up to something, house sparrows love hanging out in noisy little gangs, chattering away from the hedge. They''re big fans of seeds and will happily tuck into a feeder, though insects are on the menu too when raising chicks. A dense hedge or shrub is prime sparrow real estate.', 9),
  ('bird', 'Starling',   '/birds/starling.webp',    'From a distance starlings look plain, but look closer and their feathers shimmer with green and purple, speckled like something out of a fairy tale. They''re not fussy eaters, tucking into insects, fruit and whatever''s on the bird table, and they''re excellent mimics too. Watch for their dramatic, swirling flocks at dusk.', 10),
  ('bird', 'Thrush',     '/birds/thrush.webp',      'The song thrush is a shy but tuneful garden visitor, known for repeating each phrase of its song two or three times, as if to make sure you heard it. They love hunting for snails, cracking the shells open on a favourite stone, and will happily forage for worms and berries too. A real treat to spot.', 11),
  ('bird', 'Wren',       '/birds/wren.webp',        'Don''t let the size fool you — the wren is tiny but mighty, belting out a surprisingly loud, warbling song for such a small bird. They creep about low in hedges and undergrowth hunting for insects and spiders, rarely visiting feeders. Dense, scrubby planting is the best way to tempt one into your garden.', 12);
