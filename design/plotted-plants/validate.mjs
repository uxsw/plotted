import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const outDir = join(root, 'out');
const W = 440, H = 620, EPS = 0.01;

function pathPoints(d) {
  const nums = d.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
  const pts = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
  return pts;
}

function group(svg, cls) {
  const m = svg.match(new RegExp(`<g class="${cls}"([^>]*)>([\\s\\S]*?)</g>`));
  return m ? { attrs: m[1], body: m[2] } : null;
}

const files = readdirSync(outDir).filter((n) => n.endsWith('.svg'));
let failures = 0;

for (const file of files) {
  const svg = readFileSync(join(outDir, file), 'utf8');
  const strokeLayer = file.endsWith('.stroke.svg');
  const problems = [];

  if (!svg.includes(`width="${W}"`) || !svg.includes(`height="${H}"`)) problems.push('width/height not 440x620');
  if (!svg.includes(`viewBox="0 0 ${W} ${H}"`)) problems.push('viewBox not 0 0 440 620');

  const stems = group(svg, 'stems');
  const heads = group(svg, 'heads');
  if (!stems) problems.push('missing <g class="stems">');
  if (!heads) problems.push('missing <g class="heads">');

  let touches = 0, headCount = 0, stemCount = 0, maxY = -Infinity;
  if (stems) {
    if (strokeLayer && !/fill="none"/.test(stems.attrs)) problems.push('stroke layer: stems group should have fill="none"');
    if (!strokeLayer && /stroke="(?!none)/.test(stems.attrs)) problems.push('fill layer: stems should not carry a stroke');
    for (const m of stems.body.matchAll(/ d="([^"]+)"/g)) {
      stemCount++;
      let hit = false;
      for (const [x, y] of pathPoints(m[1])) {
        if (x < -EPS || x > W + EPS) problems.push(`stem point x out of artboard: ${x}`);
        if (y < -EPS || y > H + EPS) problems.push(`stem point y out of artboard: ${y}`);
        if (y > maxY) maxY = y;
        if (y >= H - 0.5) hit = true;
      }
      if (hit) touches++;
    }
    if (touches === 0) problems.push('no stem touches the bottom edge (y=620)');
  }
  if (heads) {
    for (const m of heads.body.matchAll(/<path class="head" d="([^"]+)"/g)) {
      headCount++;
      for (const [x, y] of pathPoints(m[1])) {
        if (x < 0 || x > W || y < 0 || y > H) { problems.push(`head point out of artboard: ${x},${y}`); break; }
      }
    }
    if (headCount === 0) problems.push('no .head shapes');
    if (/<path class="head"[^>]*(stroke|fill)=/.test(heads.body)) problems.push('head carries its own fill/stroke attribute (breaks per-band colouring)');
  }

  const kb = (Buffer.byteLength(svg) / 1024).toFixed(1);
  if (problems.length) {
    failures++;
    console.log(`FAIL ${file}`);
    for (const p of [...new Set(problems)].slice(0, 8)) console.log('   -', p);
  } else {
    console.log(`ok   ${file}  ${stemCount} stems (${touches} on the edge), ${headCount} heads, ${kb} KB`);
  }
}

process.exit(failures ? 1 : 0);
