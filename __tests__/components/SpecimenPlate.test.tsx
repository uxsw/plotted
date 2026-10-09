import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SpecimenPlate, plateGradient } from "@/components/plants/SpecimenPlate";

const SEEDHEAD =
  '<svg class="c-specimen-plate__mark" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" aria-hidden="true"><path d="M24 42V20"></path><path d="M24 20c0-6 3-10 3-10s3 4 3 10-3 10-3 10-3-4-3-10Z"></path><path d="M24 24c-1-5-5-8-5-8s-1 5 1 9 4 6 4 6"></path><path d="M24 24c1-5 5-8 5-8s1 5-1 9-4 6-4 6"></path><path d="M18 42h12"></path></svg>';

describe("SpecimenPlate – Latin (default) variant", () => {
  it("draws the monogram from the genus, with no frame or plate number", () => {
    const html = renderToStaticMarkup(
      <SpecimenPlate genus="Verbena" species="bonariensis" cultivar={null} commonName="Purpletop vervain" />
    );
    expect(html).toMatch(
      /^<div class="c-specimen-plate" data-gradient="[123]" aria-hidden="true"><span class="c-specimen-plate__monogram o-type-display">V<\/span><\/div>$/
    );
  });

  it("falls back to the seed-head mark when there is no letter to draw", () => {
    expect(
      renderToStaticMarkup(<SpecimenPlate genus="" species={null} cultivar={null} commonName={undefined} />)
    ).toContain(`aria-hidden="true">${SEEDHEAD}</div>`);
  });

  it("falls through a blank genus to the species", () => {
    expect(renderToStaticMarkup(<SpecimenPlate genus="" species="apple" />)).toContain(">A</span>");
  });

  it("ignores a stray `name` unless the plain variant is asked for", () => {
    expect(renderToStaticMarkup(<SpecimenPlate genus="Verbena" name="zinnia" />)).toContain(">V</span>");
  });
});

describe("SpecimenPlate – plain variant (free-text name)", () => {
  it("takes the monogram from the name and adds the modifier class", () => {
    const html = renderToStaticMarkup(<SpecimenPlate variant="plain" name="that red salvia" />);
    expect(html).toContain('class="c-specimen-plate c-specimen-plate--plain"');
    expect(html).toContain('<span class="c-specimen-plate__monogram o-type-display">T</span>');
  });

  it("skips leading punctuation and digits, and never reads the Latin props", () => {
    expect(
      renderToStaticMarkup(<SpecimenPlate variant="plain" name="'Amistad' salvia" genus="Zinnia" />)
    ).toContain(">A</span>");
    expect(
      renderToStaticMarkup(<SpecimenPlate variant="plain" name="123" genus="Zinnia" />)
    ).toContain("c-specimen-plate__mark");
  });
});

describe("SpecimenPlate – gradient and children", () => {
  it("picks the same gradient for the same seed, and uses all three", () => {
    expect(plateGradient("Verbena")).toBe(plateGradient("Verbena"));
    expect(new Set(["a", "b", "c"].map(plateGradient))).toEqual(new Set([1, 2, 3]));
  });

  it("shows children in place of the monogram", () => {
    const html = renderToStaticMarkup(
      <SpecimenPlate seed="scheme-1" genus="Verbena">
        <i>mark</i>
      </SpecimenPlate>
    );
    expect(html).toContain("<i>mark</i>");
    expect(html).not.toContain("c-specimen-plate__monogram");
  });
});
