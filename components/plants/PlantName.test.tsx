import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PlantName } from "./PlantName";

// No React Testing Library in this repo — renderToStaticMarkup gives real JSX
// output without needing jsdom, sufficient to assert on visible text.

describe("PlantName", () => {
  it("card variant: shows the full binomial + cultivar when genus is present", () => {
    // Bug this guards: used to drop genus entirely and render "Reptans"
    // (bare, capitalised) even when genus was available.
    const html = renderToStaticMarkup(
      <PlantName genus="Ajuga" species="reptans" cultivar="Burgundy Glow" variant="card" />
    );
    expect(html).toContain("Ajuga reptans");
    expect(html).toContain("Burgundy Glow");
    expect(html).not.toContain("Reptans");
  });

  it("card variant: falls back to bare species (capitalised) when genus is blank — legacy rows", () => {
    const html = renderToStaticMarkup(
      <PlantName genus="" species="serpyllum" cultivar={null} variant="card" />
    );
    expect(html).toContain("Serpyllum");
    expect(html).not.toContain("Unnamed plant");
  });

  it("card variant: falls back to bare genus for a genus-only record (no bug: used to be 'Unnamed plant')", () => {
    const html = renderToStaticMarkup(
      <PlantName genus="Thymus" species={null} cultivar={null} variant="card" />
    );
    expect(html).toContain("Thymus");
    expect(html).not.toContain("Unnamed plant");
  });

  it("card variant: falls back to 'Unnamed plant' only when genus is also empty", () => {
    const html = renderToStaticMarkup(
      <PlantName genus="" species={null} cultivar={null} variant="card" />
    );
    expect(html).toContain("Unnamed plant");
  });

  it("card variant: omitting genus entirely behaves the same as empty genus", () => {
    const html = renderToStaticMarkup(<PlantName species={null} cultivar={null} variant="card" />);
    expect(html).toContain("Unnamed plant");
  });

  it("detail variant: shows the full binomial when genus is present — the bug this fix targets", () => {
    // This is the exact case confirmed live in stage 5's worked example:
    // a species-only record with no common name rendering as the bare
    // epithet ("Serpyllum") on the plant detail heading.
    const html = renderToStaticMarkup(
      <PlantName genus="Thymus" species="serpyllum" cultivar={null} commonNames={[]} variant="detail" />
    );
    expect(html).toContain("Thymus serpyllum");
    expect(html).not.toContain("Serpyllum");
  });

  it("detail variant: falls back to bare species (capitalised) when genus is blank — legacy rows", () => {
    const html = renderToStaticMarkup(
      <PlantName genus="" species="serpyllum" cultivar={null} commonNames={[]} variant="detail" />
    );
    expect(html).toContain("Serpyllum");
  });

  it("detail variant: falls back to bare genus for a genus-only record", () => {
    const html = renderToStaticMarkup(
      <PlantName genus="Thymus" species={null} cultivar={null} variant="detail" />
    );
    expect(html).toContain("Thymus");
    expect(html).not.toContain("Unnamed plant");
  });

  it("detail variant: 'Unnamed plant' when genus is also empty (the fully unidentified case)", () => {
    const html = renderToStaticMarkup(
      <PlantName genus="" species={null} cultivar={null} variant="detail" />
    );
    expect(html).toContain("Unnamed plant");
  });

  it("shows species lowercase once genus leads the name, not capitalised", () => {
    const html = renderToStaticMarkup(
      <PlantName genus="Ajuga" species="reptans" cultivar={null} variant="card" />
    );
    expect(html).toContain("Ajuga reptans");
  });

  // A typed common name stays primary; the Latin name is secondary.
  it("card variant: a typed name is the primary line, and the Latin name is left to the caller's secondary slot", () => {
    const html = renderToStaticMarkup(
      <PlantName genus="Malus" species="domestica" cultivar={null} typedName="Apple" variant="card" />
    );
    expect(html).toBe("<span>Apple</span>");
  });

  it("detail variant: typed name first, Latin beneath, and the typed name is not repeated among common names", () => {
    const html = renderToStaticMarkup(
      <PlantName genus="Malus" species="domestica" cultivar={null} commonNames={["Apple", "Eating apple"]} typedName="Apple" variant="detail" />
    );
    expect(html.indexOf("Apple")).toBeLessThan(html.indexOf("Malus domestica"));
    expect(html.match(/Apple/g)).toHaveLength(1);
    expect(html).toContain("Eating apple");
  });

  it("detail variant: a typed name over a genus-only resolution shows the genus beneath", () => {
    const html = renderToStaticMarkup(
      <PlantName genus="Rosa" species={null} cultivar={null} typedName="Climbing rose" variant="detail" />
    );
    expect(html.indexOf("Climbing rose")).toBeLessThan(html.indexOf("Rosa"));
  });

  it("with no typed name the Latin name stays primary (typed Latin, photo identification)", () => {
    const html = renderToStaticMarkup(
      <PlantName genus="Malus" species="domestica" cultivar={null} commonNames={["Apple"]} typedName={null} variant="detail" />
    );
    expect(html.indexOf("Malus domestica")).toBeLessThan(html.indexOf("Apple"));
  });
});
