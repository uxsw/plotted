import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PlantName } from "./PlantName";

// No React Testing Library in this repo — renderToStaticMarkup gives real JSX
// output without needing jsdom, sufficient to assert on visible text.

describe("PlantName", () => {
  it("card variant: shows species + cultivar when present", () => {
    const html = renderToStaticMarkup(
      <PlantName genus="Ajuga" species="reptans" cultivar="Burgundy Glow" variant="card" />
    );
    expect(html).toContain("Reptans");
    expect(html).toContain("Burgundy Glow");
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

  it("does not show genus alongside species — that binomial form is a different component's job", () => {
    const html = renderToStaticMarkup(
      <PlantName genus="Ajuga" species="reptans" cultivar={null} variant="card" />
    );
    expect(html).not.toContain("Ajuga");
    expect(html).toContain("Reptans");
  });
});
