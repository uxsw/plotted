import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { optimize } from 'svgo';

const root = new URL('.', import.meta.url).pathname;
const outDir = join(root, 'out');
const distDir = join(root, 'dist');
mkdirSync(distDir, { recursive: true });

const precision = Number(process.env.PRECISION ?? 1);
const config = {
  multipass: true,
  floatPrecision: precision,
  plugins: [
    'preset-default',
  ],
};

const kb = (n) => (n / 1024).toFixed(1).padStart(6);
let totalIn = 0, totalOut = 0, totalGz = 0, totalBr = 0;
const rows = [];

for (const file of readdirSync(outDir).filter((n) => n.endsWith('.svg') && !n.endsWith('.stroke.svg'))) {
  let svg = readFileSync(join(outDir, file), 'utf8');
  const before = Buffer.byteLength(svg);
  svg = svg.replace(/ id="[^"]*"/g, '').replace(/ class="leaf"/g, '');
  let hi = 0;
  svg = svg.replace(/<path class="head"/g, () => `<path class="head" data-h="${++hi}"`);
  const res = optimize(svg, { path: file, ...config });
  const out = res.data.endsWith('\n') ? res.data : res.data + '\n';
  writeFileSync(join(distDir, file), out);
  const raw = Buffer.byteLength(out), gz = gzipSync(out, { level: 9 }).length, br = brotliCompressSync(out).length;
  totalIn += before; totalOut += raw; totalGz += gz; totalBr += br;
  rows.push(`${basename(file, '.svg').padEnd(14)} ${kb(before)} -> ${kb(raw)} KB   gzip ${kb(gz)}  brotli ${kb(br)}`);
}
console.log(rows.join('\n'));
console.log(`${'TOTAL'.padEnd(14)} ${kb(totalIn)} -> ${kb(totalOut)} KB   gzip ${kb(totalGz)}  brotli ${kb(totalBr)}`);
