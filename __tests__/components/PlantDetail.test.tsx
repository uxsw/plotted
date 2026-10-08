import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Plant, SpeciesRef } from "@/lib/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/app/actions/plants", () => ({ updatePlantField: vi.fn(), markLookupNoticeSeen: vi.fn() }));
vi.mock("@/components/DeletePlantButton", () => ({ default: () => null }));
vi.mock("@/lib/uploadPhoto", () => ({ uploadPlantPhoto: vi.fn() }));

import PlantDetail from "@/components/PlantDetail";
import { isFrostLookupPending } from "@/lib/species-reference-timing";

const PLANT: Plant = {
  id: "plant-1",
  user_id: "user-1",
  genus: "Malus",
  species: "domestica",
  cultivar: null,
  species_input: null,
  identification_status: "identified",
  species_source: "manual",
  date_planted: null,
  photo_url: null,
  image_source: null,
  image_attribution: null,
  sun_needs: null,
  flowering_season_from: null,
  flowering_season_to: null,
  eventual_height_cm: null,
  eventual_spread_cm: null,
  status: "active",
  notes: null,
  common_names: [],
  lookup_status: "success",
  lookup_notice_seen_at: "2026-10-01T00:00:00Z",
  created_at: "2026-10-08T00:00:00Z",
  updated_at: "2026-10-08T00:00:00Z",
};

const LOADING = "Looking up frost tolerance";

function render(plant: Plant, speciesRef: SpeciesRef | null, recentlyAdded = true) {
  return renderToStaticMarkup(<PlantDetail plant={plant} speciesRef={speciesRef} recentlyAdded={recentlyAdded} />);
}

describe("PlantDetail – frost tolerance", () => {
  it("shows the loading message for a new plant with a genus and no row yet", () => {
    expect(render(PLANT, null)).toContain(LOADING);
  });

  it("hides the loading message when the plant has no genus: nothing will ever arrive", () => {
    const html = render({ ...PLANT, genus: "", species: "officinalis" }, null);
    expect(html).not.toContain(LOADING);
    expect(html).not.toContain("Frost tolerance");
  });

  it("a plant with no frost data degrades quietly: no message, no empty block", () => {
    for (const ref of [
      { id: "r", lookup_status: "failed", frost_tolerance_c: null, frost_tolerance_notice: null },
      { id: "r", lookup_status: "complete", frost_tolerance_c: null, frost_tolerance_notice: null },
    ] satisfies SpeciesRef[]) {
      const html = render(PLANT, ref);
      expect(html).not.toContain(LOADING);
      expect(html).not.toContain("Frost tolerance");
    }
  });

  it("shows the value once the row is complete", () => {
    const html = render(PLANT, {
      id: "r",
      lookup_status: "complete",
      frost_tolerance_c: -15,
      frost_tolerance_notice: "Estimated tolerance",
    });
    expect(html).toContain("Frost tolerance");
    expect(html).toContain("-15");
  });
});

describe("isFrostLookupPending", () => {
  const pending = { lookup_status: "pending" as const };

  it("needs a recent plant, a genus, and no finished row", () => {
    expect(isFrostLookupPending({ recentlyAdded: true, genus: "Malus", speciesRef: null })).toBe(true);
    expect(isFrostLookupPending({ recentlyAdded: true, genus: "Malus", speciesRef: pending })).toBe(true);
    expect(isFrostLookupPending({ recentlyAdded: false, genus: "Malus", speciesRef: null })).toBe(false);
    expect(isFrostLookupPending({ recentlyAdded: true, genus: "Malus", speciesRef: { lookup_status: "complete" } })).toBe(false);
  });

  it("is never pending without a genus, whatever the row says", () => {
    for (const genus of ["", "  ", null, undefined]) {
      expect(isFrostLookupPending({ recentlyAdded: true, genus, speciesRef: null })).toBe(false);
      expect(isFrostLookupPending({ recentlyAdded: true, genus, speciesRef: pending })).toBe(false);
    }
  });
});

describe("PlantDetail – a plant typed as a common name", () => {
  it("heads the page with the typed name and puts the Latin name beneath", () => {
    const html = render({ ...PLANT, species_input: "apple", common_names: ["Apple"] }, null, false);
    expect(html.indexOf("Apple")).toBeGreaterThan(-1);
    expect(html.indexOf("Apple")).toBeLessThan(html.indexOf("Malus domestica"));
  });

  it("heads the page with the Latin name when nothing typed was kept", () => {
    const html = render({ ...PLANT, common_names: ["Apple"] }, null, false);
    expect(html.indexOf("Malus domestica")).toBeLessThan(html.indexOf("Apple"));
  });
});
