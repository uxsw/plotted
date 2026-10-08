import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/ui/Carousel.module.css", () => ({ default: {} }));

import { PlantCardName } from "@/components/dashboard/GardenCardScroller";

const BASE = {
  id: "p",
  genus: "Malus",
  species: "domestica",
  cultivar: null,
  common_names: ["Apple"],
  photo_url: null,
  identification_status: "identified" as const,
};

describe("dashboard card name", () => {
  it("typed common name: typed name first and upright, Latin beneath", () => {
    const html = renderToStaticMarkup(<PlantCardName plant={{ ...BASE, species_input: "dwarf apple" }} />);
    expect(html.indexOf("Dwarf apple")).toBeLessThan(html.indexOf("Malus domestica"));
    expect(html).toMatch(/<p class="o-type-display long-primer kirk"><span>Dwarf apple<\/span>/);
  });

  it("no typed name: Latin first and italic, first common name beneath", () => {
    const html = renderToStaticMarkup(<PlantCardName plant={{ ...BASE, species_input: null }} />);
    expect(html.indexOf("Malus domestica")).toBeLessThan(html.indexOf("Apple"));
    expect(html).toContain("o-type--italic");
  });
});
