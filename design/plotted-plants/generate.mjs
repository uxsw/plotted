import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { ARTBOARD, buildStroke, outlinePath, centrelinePath, headPaths, blobPath, leafletPath, rng } from './lib.mjs';

const root = new URL('.', import.meta.url).pathname;
const dataDir = join(root, 'data');
const outDir = join(root, 'out');
mkdirSync(outDir, { recursive: true });

const only = process.argv.slice(2);
const files = readdirSync(dataDir).filter((n) => n.endsWith('.json'));
const INK = '#1C1B19';
const HEAD = '#D4795A';

function svgOpen(plant, title) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ARTBOARD.w}" height="${ARTBOARD.h}" viewBox="0 0 ${ARTBOARD.w} ${ARTBOARD.h}">` +
    `<title>${title}</title>`
  );
}

for (const file of files) {
  const name = basename(file, '.json');
  if (only.length && !only.includes(name)) continue;
  const plant = JSON.parse(readFileSync(join(dataDir, file), 'utf8'));
  const built = plant.strokes.map((s, i) => buildStroke(s, plant, i));

  const headRand = rng((plant.seed ?? 1) * 7919 + 5);
  const heads = (plant.heads ?? []).map((h) => headPaths(h, headRand));

  const headsSvg = heads.map((d) => `<path class="head" d="${d}"/>`).join('');

  const leafRand = rng((plant.seed ?? 1) * 104729 + 9);
  const leafSvg = (plant.leaves ?? [])
    .map((l) => `<path class="leaf" d="${l.type === 'leaflet' ? leafletPath(l, leafRand) : blobPath(l, leafRand)}"/>`)
    .join('');
  const fillStems = plant.strokes
    .map((s, i) => `<path id="${s.id ?? 's' + i}" d="${outlinePath(s, built[i])}"/>`)
    .join('') + leafSvg;
  const fill =
    svgOpen(plant, plant.title ?? name) +
    (plant.inkOverHeads
      ? `<g class="heads" fill="${HEAD}" stroke="none">${headsSvg}</g><g class="stems" fill="${INK}" stroke="none">${fillStems}</g>`
      : `<g class="stems" fill="${INK}" stroke="none">${fillStems}</g><g class="heads" fill="${HEAD}" stroke="none">${headsSvg}</g>`) +
    `</svg>\n`;
  writeFileSync(join(outDir, `${name}.svg`), fill);

  const strokeStems = plant.strokes
    .map((s, i) => {
      const mean = built[i].widths.reduce((a, b) => a + b, 0) / built[i].widths.length;
      return `<path id="${s.id ?? 's' + i}" pathLength="1" stroke-width="${Math.round(mean * 10) / 10}" d="${centrelinePath(built[i])}"/>`;
    })
    .join('');
  const stroke =
    svgOpen(plant, `${plant.title ?? name} (stroke layer)`) +
    `<g class="stems" fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">${strokeStems}</g>` +
    `<g class="heads" fill="${HEAD}" stroke="none">${headsSvg}</g></svg>\n`;
  writeFileSync(join(outDir, `${name}.stroke.svg`), stroke);

  console.log(`${name}: ${plant.strokes.length} strokes, ${heads.length} heads`);
}
