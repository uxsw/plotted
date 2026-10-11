import SchemeResults from "@/components/SchemeResults";
import type { Scheme, SchemeSuggestion } from "@/lib/types";
import type { SchemeArticle } from "@/lib/scheme-article";

/**
 * /design-check/scheme — the finished planting scheme with fixture content,
 * for visual review without signing in. Nothing here is saved, and the
 * actions will fail (there is no session), which is also how the entries'
 * error states can be seen.
 *
 * `?pictures=none` shows the page with no photographs at all (the likely case
 * for a list of uncommon cultivars); `?pictures=all` gives every plant one.
 * `?prose=1` shows a scheme with no structured write-up (the /schemes/new
 * form journey, and anything saved before the structure existed).
 * `?photo=1` adds the gardener's own photograph to the masthead.
 */

const SCHEME: Scheme = {
  id: "fixture-scheme",
  user_id: "fixture-user",
  status: "complete",
  name: "The Long Dry Summer",
  summary: "A sun-baked gravel border that flowers from May to the first frosts and never asks for the hose.",
  space: "medium",
  successional: true,
  edible: false,
  narrative_intro:
    "These are plants that would rather be ignored. Given your south-facing wall and thin, stony soil, they will knit into a border that moves in the wind, hums with bees from late spring, and holds its shape as seed heads long after the colour has gone.",
  narrative_body:
    "Start with height at the back, where the verbena and the giant oat grass can catch the evening light without shading anything in front of them. Set them in loose threes rather than a row, so you look through them rather than at them. In the middle, let the salvia and the sea holly run together in drifts of five or seven; their upright spikes and round, metallic heads are the heart of the scheme. Along the front, the catmint and the thyme should be allowed to spill over the edge of the gravel and soften the line.\n\nThe work is light and nearly all of it falls in two short spells. In late February or March, cut everything that stood through winter down to the ground before new growth starts. In July, shear the catmint and the salvias back by a third once their first flush fades, and they will flower again into October. Don't feed, and water only in the first summer while roots establish.",
  article: null,
  featured_plant_latin: "Eryngium × zabelii 'Big Blue'",
  ai_notice_seen_at: "2026-10-01T09:00:00.000Z",
  origin: "conversation",
  draft_id: null,
  created_at: "2026-10-01T09:00:00.000Z",
  updated_at: "2026-10-01T09:00:00.000Z",
};

const BASE: SchemeSuggestion = {
  id: "",
  scheme_id: SCHEME.id,
  common_name: "",
  latin_name: "",
  tier: "mid",
  height_cm: null,
  flowering_months: null,
  why: "",
  wildlife_value: false,
  drought_tolerant: false,
  edible: false,
  british_native: false,
  look: null,
  care: null,
  flower_colour: null,
  plant_id: null,
  planted_at: null,
  wikimedia_image_url: null,
  wikimedia_attribution: null,
  saved: true,
  sort_order: 0,
};

const PLANTS: SchemeSuggestion[] = (
  [
  {
    ...BASE,
    id: "fixture-verbena",
    common_name: "Purpletop vervain",
    latin_name: "Verbena bonariensis",
    tier: "back",
    height_cm: 180,
    flowering_months: [6, 7, 8, 9, 10],
    look: "Small violet tufts floating on wiry, see-through stems, head high",
    why: "The transparent screen at the back: height without weight, so the plants behind and in front still read.",
    care: "Leave the stems standing through winter and cut to the base in March.",
    flower_colour: "purple",
    wildlife_value: true,
    drought_tolerant: true,
    wikimedia_image_url: "/demo-thumb-digitalis.jpg",
    wikimedia_attribution: "https://commons.wikimedia.org/",
  },
  {
    ...BASE,
    id: "fixture-stipa",
    common_name: "Giant oat grass",
    latin_name: "Stipa gigantea 'Gold Fontaene'",
    tier: "back",
    height_cm: 220,
    flowering_months: [6, 7, 8],
    look: "Shimmering gold oat heads on arching stems, well above head height",
    why: "Catches low evening sun behind the verbena and keeps the border standing as seed heads into winter.",
    care: "Comb out dead leaves by hand in spring. Never cut it to the ground.",
    flower_colour: "yellow",
    drought_tolerant: true,
  },
  {
    ...BASE,
    id: "fixture-salvia",
    common_name: "Balkan clary",
    latin_name: "Salvia nemorosa 'Caradonna'",
    tier: "mid",
    height_cm: 60,
    flowering_months: [5, 6, 7, 9, 10],
    look: "Violet-blue spires on near-black stems, knee high",
    why: "The strong vertical in the middle of the border, and the first big flush of colour in late May.",
    care: "Cut back by a third as the first flowers fade in July for a second flush.",
    flower_colour: "blue",
    wildlife_value: true,
    drought_tolerant: true,
    plant_id: "fixture-garden-plant",
    wikimedia_image_url: "/demo-thumb-firecracker.jpg",
    wikimedia_attribution: "https://commons.wikimedia.org/",
  },
  {
    ...BASE,
    id: "fixture-eryngium",
    common_name: "Sea holly",
    latin_name: "Eryngium × zabelii 'Big Blue'",
    tier: "mid",
    height_cm: 70,
    flowering_months: [7, 8, 9],
    look: "Steel-blue thimbles in spiky ruffs, the whole plant flushed metallic",
    why: "Round, hard-edged heads to set against the salvia's spires, at their best when the salvia is resting.",
    care: "Plant small and don't move it. It resents disturbance once the taproot is down.",
    flower_colour: "blue",
    wildlife_value: true,
    drought_tolerant: true,
  },
  {
    ...BASE,
    id: "fixture-achillea",
    common_name: "Yarrow",
    latin_name: "Achillea 'Terracotta'",
    tier: "mid",
    height_cm: 80,
    flowering_months: [6, 7, 8, 9],
    look: "Flat plates of burnt orange fading to biscuit over feathery grey leaves",
    why: "The one warm colour in a cool scheme, and a flat shape among the spikes and globes.",
    care: "Divide every third spring to keep the clumps flowering well.",
    flower_colour: "orange",
    wildlife_value: true,
    drought_tolerant: true,
    british_native: false,
  },
  {
    ...BASE,
    id: "fixture-nepeta",
    common_name: "Catmint",
    latin_name: "Nepeta racemosa 'Walker's Low'",
    tier: "ground",
    height_cm: 45,
    flowering_months: [5, 6, 7, 8, 9],
    look: "A soft grey mound hazed with lavender-blue for months",
    why: "Spills over the front edge and hides the bare ankles of the salvia behind it.",
    care: "Shear to a few inches in July once the first flowers fade.",
    flower_colour: "purple",
    wildlife_value: true,
    drought_tolerant: true,
    wikimedia_image_url: "/demo-thumb-thyme.jpg",
    wikimedia_attribution: "https://commons.wikimedia.org/",
  },
  {
    ...BASE,
    id: "fixture-thyme",
    common_name: "Creeping thyme",
    latin_name: "Thymus serpyllum 'Pink Chintz'",
    tier: "ground",
    height_cm: 5,
    flowering_months: [6, 7],
    look: "A grey-green mat a finger high, smothered in shell pink",
    why: "Knits the gravel to the planting and scents the path when you brush past.",
    care: "Trim lightly after flowering to keep the mat dense.",
    flower_colour: "pink",
    wildlife_value: true,
    drought_tolerant: true,
    edible: true,
  },
  {
    ...BASE,
    id: "fixture-euphorbia",
    common_name: "Mediterranean spurge",
    latin_name: "Euphorbia characias subsp. wulfenii",
    tier: "back",
    height_cm: 120,
    flowering_months: [3, 4, 5],
    look: "Blue-grey bottlebrush stems topped with domes of acid lime",
    why: "Evergreen bulk through winter and the only thing in flower before the salvia starts.",
    care: "Cut flowered stems to the base in June. Wear gloves, as the sap irritates skin.",
    flower_colour: "green",
    drought_tolerant: true,
  },
  ] satisfies SchemeSuggestion[]
).map((plant, index) => ({ ...plant, sort_order: index }));

const ARTICLE: SchemeArticle = {
  key_idea: "Tall and see-through at the back, so the low plants are never in shade.",
  glance: {
    aspect: "Full sun, south or west facing",
    soil: "Thin, stony, free-draining",
    at_its_best: "Late June into August",
    upkeep: "Light: two short spells a year",
  },
  arrangement: {
    back: "Set the verbena and oat grass in loose threes, a stride apart, so you look through them. Give the spurge a corner to itself where its winter shape can be seen.",
    mid: "Run the salvia and sea holly together in drifts of five or seven, with the yarrow in a single group near the middle as the warm note.",
    ground: "Let the catmint spill over the edge in a broken line, and tuck the thyme into the gravel in front where feet will brush it.",
  },
  pairings: [
    {
      a: "Salvia nemorosa 'Caradonna'",
      b: "Achillea 'Terracotta'",
      why: "Violet spires against flat burnt-orange plates: the scheme's strongest contrast of both colour and shape.",
    },
    {
      a: "Eryngium × zabelii 'Big Blue'",
      b: "Stipa gigantea 'Gold Fontaene'",
      why: "Steel blue under shimmering gold, and both stand as seed heads long after flowering.",
    },
    {
      a: "Euphorbia characias subsp. wulfenii",
      b: "Nepeta racemosa 'Walker's Low'",
      why: "The spurge's lime domes fade just as the catmint's blue haze takes over beneath them.",
    },
  ],
  jobs: [
    {
      from: 10,
      to: 11,
      title: "Plant while the soil is warm",
      detail: "Autumn planting lets roots settle over winter, so the border needs far less water next summer.",
      plants: [],
    },
    {
      from: 2,
      to: 3,
      title: "Cut down what stood through winter",
      detail: "Take the verbena, salvia and yarrow to the ground before new shoots appear.",
      plants: ["Verbena bonariensis", "Salvia nemorosa 'Caradonna'", "Achillea 'Terracotta'"],
    },
    {
      from: 3,
      to: 4,
      title: "Comb out the oat grass",
      detail: "Pull dead leaves free with gloved fingers. It is evergreen and should never be cut hard.",
      plants: ["Stipa gigantea 'Gold Fontaene'"],
    },
    {
      from: 6,
      to: 6,
      title: "Remove flowered spurge stems",
      detail: "Cut each spent stem to the base to make room for next year's shoots. Wear gloves.",
      plants: ["Euphorbia characias subsp. wulfenii"],
    },
    {
      from: 7,
      to: 7,
      title: "Shear for a second flush",
      detail: "Cut the catmint and salvia back by a third as the first flowers fade. They return in September.",
      plants: ["Nepeta racemosa 'Walker's Low'", "Salvia nemorosa 'Caradonna'"],
    },
    {
      from: 6,
      to: 8,
      title: "Water in the first summer only",
      detail: "A deep soak once a week while roots establish. After that, leave the hose alone.",
      plants: [],
    },
  ],
};

export default async function SchemeDesignCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ pictures?: string; prose?: string; photo?: string }>;
}) {
  const { pictures, prose, photo } = await searchParams;

  const plants = PLANTS.map((plant) => {
    if (pictures === "none") return { ...plant, wikimedia_image_url: null, wikimedia_attribution: null };
    if (pictures === "all" && !plant.wikimedia_image_url) {
      return { ...plant, wikimedia_image_url: "/demo-thumb-geum.jpg", wikimedia_attribution: "https://commons.wikimedia.org/" };
    }
    return plant;
  }).map((plant) =>
    // An older scheme: no word-picture, care tip or flower colour either.
    prose ? { ...plant, look: null, care: null, flower_colour: null } : plant
  );

  return (
    <div className="min-h-screen">
      <main className="o-page">
        <SchemeResults
          scheme={{ ...SCHEME, article: prose ? null : ARTICLE }}
          suggestions={plants}
          heroImage={photo ? "/garden-hero-2.jpg" : null}
          onListLatin={["Achillea 'Terracotta'"]}
          gardenPlantIds={{ "fixture-salvia": "fixture-garden-plant" }}
        />
      </main>
    </div>
  );
}
