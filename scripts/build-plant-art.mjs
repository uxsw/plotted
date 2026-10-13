/**
 * Gathers the optimised plant drawings (design/plotted-plants/dist/*.svg)
 * into one sprite the marketing homepage draws from (public/walk-plants.svg),
 * one <symbol> per plant, used as <use href="/walk-plants.svg#rose">.
 *
 * Run after rebuilding the drawings:
 *   node scripts/build-plant-art.mjs
 *
 * Ink takes the using element's `color`; flower heads take its `--_bloom`.
 * Both are set inline because page CSS cannot reach inside an external
 * sprite, but inherited values can. Group order is kept as drawn: some plants
 * ink over their flower heads (the rose's spiral), others the reverse.
 *
 * If a plant is added or removed, update BRUSH_PLANTS in
 * app/(marketing)/_components/Horizon.tsx to match.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const distDir = join(root, "design/plotted-plants/dist");
const target = join(root, "public/walk-plants.svg");

const symbols = [];
for (const file of readdirSync(distDir).filter((n) => n.endsWith(".svg")).sort()) {
  const svg = readFileSync(join(distDir, file), "utf8");
  const layers = [];
  for (const group of svg.matchAll(/<g\b[^>]*class="(stems|heads)"[^>]*>(.*?)<\/g>/gs)) {
    const paths = [...group[2].matchAll(/<path\b[^>]*\sd="([^"]+)"/g)].map((m) => `<path d="${m[1]}"/>`);
    if (!paths.length) continue;
    const fill = group[1] === "heads" ? "var(--_bloom, currentColor)" : "currentColor";
    layers.push(`<g style="fill:${fill}">${paths.join("")}</g>`);
  }
  if (!layers.length) throw new Error(`${file}: no .stems or .heads group found`);
  symbols.push(`<symbol id="${basename(file, ".svg")}" viewBox="0 0 440 620">${layers.join("")}</symbol>`);
}

const body = `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join("")}</svg>\n`;

writeFileSync(target, body);
console.log(`${symbols.length} plants -> ${target} (${(body.length / 1024).toFixed(1)} KB)`);
