import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
const root = new URL('.', import.meta.url).pathname;
const names = readdirSync(join(root, 'dist')).filter((n) => n.endsWith('.svg'));
const scale = 2;
for (const f of names) {
  const render = (p) => new Resvg(readFileSync(p, 'utf8'), { background: '#ffffff', fitTo: { mode: 'zoom', value: scale } }).render();
  const a = render(join(root, 'out', f)), b = render(join(root, 'dist', f));
  const pa = a.pixels, pb = b.pixels;
  let diff = 0, big = 0;
  for (let i = 0; i < pa.length; i += 4) {
    const d = Math.max(Math.abs(pa[i]-pb[i]), Math.abs(pa[i+1]-pb[i+1]), Math.abs(pa[i+2]-pb[i+2]));
    if (d > 8) diff++; if (d > 96) big++;
  }
  const total = pa.length / 4;
  const srcSvg = readFileSync(join(root, 'out', f), 'utf8'), outSvg = readFileSync(join(root, 'dist', f), 'utf8');
  const count = (t) => (t.match(/class="head"/g) || []).length;
  const w = a.width, h = a.height;
  let edge = 0;
  for (let x = 0; x < w; x++) { const i = ((h - 1) * w + x) * 4; if (pb[i] < 128) edge++; }
  const okStruct = count(srcSvg) === count(outSvg) && /class="stems"/.test(outSvg) && /class="heads"/.test(outSvg) && /viewBox="0 0 440 620"/.test(outSvg);
  console.log(`  ${f.padEnd(18)} heads ${count(srcSvg)}->${count(outSvg)}  structure ${okStruct ? 'ok' : 'BROKEN'}  ink pixels on bottom row: ${edge}`);
  console.log(f.padEnd(18), `pixels differing >3%: ${(100*diff/total).toFixed(3)}%   strongly (>38%): ${(100*big/total).toFixed(4)}%`);
}
