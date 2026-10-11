import ShoppingList from "@/components/ShoppingList";
import ShoppingListPanel from "@/components/shopping/ShoppingListPanel";
import type { ShoppingListItemData } from "@/lib/shopping-list";

/**
 * /design-check/shopping-list — the shopping list's order book with fixture
 * items, one for every state a line can be in. For visual review without
 * signing in; nothing here is saved, and the actions will fail (there is no
 * session). `?empty=1` shows the empty sheet; `?view=dashboard` shows the
 * dashboard's compact panel instead, at the dashboard's width.
 */

const BASE: ShoppingListItemData = {
  id: "",
  source: "manual",
  scheme_id: null,
  genus: null,
  species: null,
  cultivar: null,
  common_names: null,
  summary: null,
  summary_scope: null,
  lookup_candidates: [],
  entered_name: null,
  notes: null,
  where_to_buy: null,
  lookup_status: "complete",
  thumbnail_url: null,
  thumbnail_storage_path: null,
  wikimedia_attribution: null,
  created_at: "2026-10-01T09:00:00.000Z",
  scheme_name: null,
};

const ITEMS: ShoppingListItemData[] = [
  {
    ...BASE,
    id: "fixture-pending",
    entered_name: "that red salvia from Great Dixter",
    lookup_status: "pending",
    notes: "Saw it by the long border, late September",
  },
  {
    ...BASE,
    id: "fixture-geum",
    entered_name: "geum totally tangerine",
    genus: "Geum",
    species: null,
    cultivar: "Totally Tangerine",
    common_names: ["Avens"],
    summary:
      "A clump-forming perennial with soft apricot-orange flowers on tall, branching stems from late spring well into autumn.",
    summary_scope: "cultivar",
    thumbnail_url: "/demo-thumb-geum.jpg",
    wikimedia_attribution: "https://commons.wikimedia.org/",
    where_to_buy: "Hardy's Cottage Garden Plants",
    notes: "Three for the front of the hot border",
  },
  {
    ...BASE,
    id: "fixture-candidates",
    entered_name: "clematis etoile violet",
    lookup_candidates: [
      {
        genus: "Clematis",
        species: null,
        cultivar: "Étoile Violette",
        common_names: ["Clematis"],
        growth_type: "climber",
        unmatched_text: null,
      },
      {
        genus: "Clematis",
        species: "viticella",
        cultivar: null,
        common_names: ["Italian leather flower"],
        growth_type: "climber",
        unmatched_text: "etoile violet",
      },
    ],
  },
  {
    ...BASE,
    id: "fixture-foxglove",
    entered_name: "foxglove",
    genus: "Digitalis",
    species: "purpurea",
    common_names: ["Foxglove"],
    summary:
      "A biennial of woodland edges, sending up tall spires of purple, spotted bells in early summer. Much visited by bumblebees.",
    summary_scope: "species",
    thumbnail_url: "/demo-thumb-digitalis.jpg",
    wikimedia_attribution: "https://commons.wikimedia.org/",
    where_to_buy: "https://www.crocus.co.uk/plants/_/digitalis-purpurea/",
  },
  {
    ...BASE,
    id: "fixture-scheme",
    source: "scheme",
    scheme_id: "fixture-scheme-id",
    scheme_name: "Hot border, south wall",
    species: "Verbena bonariensis",
    common_names: ["Purpletop vervain"],
    lookup_status: null,
  },
  {
    ...BASE,
    id: "fixture-euphorbia",
    entered_name: "euphorbia martini ascot rainbow",
    genus: "Euphorbia",
    species: "×martini",
    cultivar: "Ascot Rainbow",
    common_names: ["Martin's spurge"],
    summary:
      "An evergreen spurge with grey-green leaves edged in cream, flushing pink in cold weather, and lime-yellow bracts in spring.",
    summary_scope: "species",
    notes: "For the gravel by the back door.\nCheck it's the variegated one.",
  },
  {
    ...BASE,
    id: "fixture-failed",
    entered_name: "the blue one Margaret has",
    lookup_status: "failed",
  },
  {
    ...BASE,
    id: "fixture-scheme-deleted",
    source: "scheme",
    species: "Stipa tenuissima",
    common_names: ["Mexican feather grass"],
    lookup_status: null,
  },
  {
    ...BASE,
    id: "fixture-not-found",
    entered_name: "bugle",
    lookup_status: "not_found",
    where_to_buy: "Village plant sale",
  },
];

export default async function ShoppingListDesignCheck({
  searchParams,
}: {
  searchParams: Promise<{ empty?: string; view?: string }>;
}) {
  const { empty, view } = await searchParams;
  if (view === "dashboard") {
    return (
      <div className="min-h-screen">
        <main className="o-page">
          <div className="c-dashboard__container">
            <ShoppingListPanel items={empty ? [] : ITEMS} />
          </div>
        </main>
      </div>
    );
  }
  return (
    <div className="min-h-screen">
      <main className="o-page">
        <ShoppingList initialItems={empty ? [] : ITEMS} />
      </main>
    </div>
  );
}
