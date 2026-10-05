import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SpecimenPlate } from "@/components/plants/SpecimenPlate";

const SEEDHEAD =
  '<svg class="c-specimen-plate__mark" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" aria-hidden="true"><path d="M24 42V20"></path><path d="M24 20c0-6 3-10 3-10s3 4 3 10-3 10-3 10-3-4-3-10Z"></path><path d="M24 24c-1-5-5-8-5-8s-1 5 1 9 4 6 4 6"></path><path d="M24 24c1-5 5-8 5-8s1 5-1 9-4 6-4 6"></path><path d="M18 42h12"></path></svg>';

// The strings below are the markup SpecimenPlate produced before the plain /
// compact variants were added (captured from the pre-change component). The
// PlantGrid call passes none of the new props, so its output must stay
// byte-for-byte what it was.
describe("SpecimenPlate – default (PlantGrid) output is unchanged", () => {
  it("genus monogram with a season tint", () => {
    expect(
      renderToStaticMarkup(
        <SpecimenPlate
          genus="Verbena"
          species="bonariensis"
          cultivar={null}
          commonName="Purpletop vervain"
          plateNumber={3}
          seasonBand="summer"
        />
      )
    ).toBe(
      '<div class="c-specimen-plate" data-season="summer" aria-hidden="true"><div class="c-specimen-plate__frame"><span class="c-specimen-plate__number o-type-label">Pl. 03</span><span class="c-specimen-plate__monogram o-type-display">V</span></div></div>'
    );
  });

  it("no name at all falls back to the seed head mark", () => {
    expect(
      renderToStaticMarkup(
        <SpecimenPlate genus="" species={null} cultivar={null} commonName={undefined} plateNumber={12} />
      )
    ).toBe(
      `<div class="c-specimen-plate" aria-hidden="true"><div class="c-specimen-plate__frame"><span class="c-specimen-plate__number o-type-label">Pl. 12</span>${SEEDHEAD}</div></div>`
    );
  });

  it("blank genus draws the monogram from the species", () => {
    expect(renderToStaticMarkup(<SpecimenPlate genus="" species="apple" plateNumber={104} />)).toBe(
      '<div class="c-specimen-plate" aria-hidden="true"><div class="c-specimen-plate__frame"><span class="c-specimen-plate__number o-type-label">Pl. 104</span><span class="c-specimen-plate__monogram o-type-display">A</span></div></div>'
    );
  });

  it("ignores a stray `name` unless the plain variant is asked for", () => {
    expect(
      renderToStaticMarkup(<SpecimenPlate genus="Verbena" name="zinnia" plateNumber={3} />)
    ).toContain('<div class="c-specimen-plate" aria-hidden="true">');
  });
});

describe("SpecimenPlate – plain variant (free-text name)", () => {
  it("takes the monogram from the name and adds the modifier classes", () => {
    const html = renderToStaticMarkup(
      <SpecimenPlate variant="plain" compact name="that red salvia" plateNumber={7} />
    );
    expect(html).toContain('class="c-specimen-plate c-specimen-plate--plain c-specimen-plate--compact"');
    expect(html).toContain('<span class="c-specimen-plate__monogram o-type-display">T</span>');
    expect(html).toContain("Pl. 07");
  });

  it("skips leading punctuation and digits, and never reads the Latin props", () => {
    expect(
      renderToStaticMarkup(<SpecimenPlate variant="plain" name="'Amistad' salvia" genus="Zinnia" plateNumber={1} />)
    ).toContain(">A</span>");
    expect(
      renderToStaticMarkup(<SpecimenPlate variant="plain" name="123" genus="Zinnia" plateNumber={1} />)
    ).toContain("c-specimen-plate__mark");
  });
});
