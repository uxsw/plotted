import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const root = new URL('.', import.meta.url).pathname;
const outDir = join(root, 'out');
const prevDir = join(root, 'preview');
mkdirSync(prevDir, { recursive: true });

const names = process.argv.slice(2);
if (!names.length) {
  console.error('usage: node preview.mjs verbena [teasel ...]');
  process.exit(1);
}

const BG = '#E8E6E1';
const wrap = (inner, w, h) => inner.replace(/<svg [^>]*>/, (m) => m);

function render(svgText, scale) {
  const r = new Resvg(svgText, { background: BG, fitTo: { mode: 'zoom', value: scale } });
  return r.render().asPng();
}

for (const n of names) {
  const svg = readFileSync(join(outDir, `${n}.svg`), 'utf8');
  writeFileSync(join(prevDir, `${n}.png`), render(svg, 1.5));
  console.log('wrote', join(prevDir, `${n}.png`));
}

if (names.length > 1) {
  const W = 440, H = 620, gap = 20, s = 1;
  const inner = names
    .map((n, i) => {
      const body = readFileSync(join(outDir, `${n}.svg`), 'utf8').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
      return `<g transform="translate(${i * (W + gap) + gap},${gap})"><rect width="${W}" height="${H}" fill="none" stroke="#C9C6BF" stroke-width="1"/>${body}</g>`;
    })
    .join('');
  const total = names.length * (W + gap) + gap;
  const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${H + gap * 2}" viewBox="0 0 ${total} ${H + gap * 2}">${inner}</svg>`;
  writeFileSync(join(prevDir, 'sheet.png'), render(sheet, 1));
  console.log('wrote', join(prevDir, 'sheet.png'));
}
