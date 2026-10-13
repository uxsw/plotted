import { getStroke } from 'perfect-freehand';

export const ARTBOARD = { w: 440, h: 620 };
export const WOBBLE_GAIN = 1.5;

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothNoise1D(rand, wavelength, length) {
  const n = Math.ceil(length / wavelength) + 3;
  const lattice = Array.from({ length: n }, () => rand() * 2 - 1);
  return (s) => {
    const x = s / wavelength + 1;
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    return lattice[i] * (1 - u) + lattice[i + 1] * u;
  };
}

export function parsePath(d) {
  const tokens = d.match(/[MmLlCcQqZz]|-?\d*\.?\d+(?:e-?\d+)?/g);
  const segs = [];
  let i = 0, cx = 0, cy = 0, cmd = null;
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? cx : 0, oy = rel ? cy : 0;
    if (C === 'M') {
      cx = ox + num(); cy = oy + num();
      segs.push({ t: 'M', p: [[cx, cy]] });
      cmd = rel ? 'l' : 'L';
    } else if (C === 'L') {
      const x = ox + num(), y = oy + num();
      segs.push({ t: 'L', p: [[cx, cy], [x, y]] });
      cx = x; cy = y;
    } else if (C === 'Q') {
      const x1 = ox + num(), y1 = oy + num(), x = ox + num(), y = oy + num();
      segs.push({ t: 'Q', p: [[cx, cy], [x1, y1], [x, y]] });
      cx = x; cy = y;
    } else if (C === 'C') {
      const x1 = ox + num(), y1 = oy + num(), x2 = ox + num(), y2 = oy + num(), x = ox + num(), y = oy + num();
      segs.push({ t: 'C', p: [[cx, cy], [x1, y1], [x2, y2], [x, y]] });
      cx = x; cy = y;
    } else if (C === 'Z') {
      continue;
    }
  }
  return segs.filter((s) => s.t !== 'M');
}

function evalSeg(seg, t) {
  const u = 1 - t;
  const p = seg.p;
  if (seg.t === 'L') return [p[0][0] * u + p[1][0] * t, p[0][1] * u + p[1][1] * t];
  if (seg.t === 'Q')
    return [0, 1].map((k) => u * u * p[0][k] + 2 * u * t * p[1][k] + t * t * p[2][k]);
  return [0, 1].map(
    (k) => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]
  );
}

export function samplePath(d, step = 3) {
  const segs = parsePath(d);
  const dense = [];
  for (const seg of segs) {
    const n = 60;
    for (let k = 0; k <= n; k++) dense.push(evalSeg(seg, k / n));
  }
  const out = [dense[0]];
  let acc = 0;
  for (let k = 1; k < dense.length; k++) {
    const dx = dense[k][0] - dense[k - 1][0], dy = dense[k][1] - dense[k - 1][1];
    acc += Math.hypot(dx, dy);
    if (acc >= step) { out.push(dense[k]); acc = 0; }
  }
  const last = dense[dense.length - 1];
  const lo = out[out.length - 1];
  if (Math.hypot(last[0] - lo[0], last[1] - lo[1]) > 0.01) out.push(last);
  return out;
}

function profileAt(profile, t) {
  if (t <= profile[0][0]) return profile[0][1];
  for (let k = 1; k < profile.length; k++) {
    if (t <= profile[k][0]) {
      const [t0, v0] = profile[k - 1], [t1, v1] = profile[k];
      const u = (t - t0) / (t1 - t0 || 1);
      const e = u * u * (3 - 2 * u);
      return v0 + (v1 - v0) * e;
    }
  }
  return profile[profile.length - 1][1];
}

export function buildStroke(stroke, plant, index) {
  const wobble = (stroke.wobble ?? plant.wobble ?? 2.2) * WOBBLE_GAIN;
  const rand = rng((plant.seed ?? 1) * 1000 + index * 17 + 3);
  const pts = samplePath(stroke.d, Number(process.env.STEP ?? 3));
  const cum = [0];
  for (let k = 1; k < pts.length; k++)
    cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  const total = cum[cum.length - 1];
  const nLow = smoothNoise1D(rand, stroke.wavelength ?? 62, total);
  const nHigh = smoothNoise1D(rand, 24, total);
  const nPress = smoothNoise1D(rand, 45, total);
  const fadeIn = Math.min(0.14, 14 / Math.max(total, 1));
  const jittered = pts.map((p, k) => {
    const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const m = Math.hypot(nx, ny) || 1;
    nx /= m; ny /= m;
    const t = cum[k] / total;
    const ramp = stroke.pinStart === false ? 1 : Math.min(1, t / fadeIn);
    const off = (nLow(cum[k]) * wobble + nHigh(cum[k]) * wobble * 0.38) * ramp;
    const onEdge = p[1] >= ARTBOARD.h - 0.5;
    return [p[0] + nx * off, onEdge ? ARTBOARD.h : Math.min(ARTBOARD.h, p[1] + ny * off)];
  });
  const base = stroke.width ?? plant.width ?? 9;
  const profile = stroke.profile ?? [[0, 1], [1, 0.4]];
  const widths = pts.map((_, k) => {
    const t = cum[k] / total;
    const w = base * profileAt(profile, t) * (1 + 0.08 * nPress(cum[k]));
    return Math.max(plant.minWidth ?? 1.6, w);
  });
  return { centre: jittered, widths, total };
}

export function outlinePath(stroke, built, maxY = ARTBOARD.h) {
  const input = built.centre.map((p, k) => [p[0], p[1], Math.min(1, built.widths[k] / (2 * (stroke.width ?? 9)))]);
  const size = stroke.width ?? 9;
  const o = getStroke(input, {
    size,
    thinning: 1,
    smoothing: 0.55,
    streamline: 0.25,
    simulatePressure: false,
    last: true,
    start: { cap: true, taper: 0 },
    end: { cap: true, taper: 0 },
  });
  const clamped = o.map(([x, y]) => [x, Math.min(y, maxY)]);
  return smoothClosed(clamped);
}

const f = (n) => (Math.round(n * 10) / 10).toString();

function smoothClosed(pts) {
  const n = pts.length;
  if (n < 3) return '';
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let k = 0; k < n; k++) {
    const p0 = pts[k], p1 = pts[(k + 1) % n];
    const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    d += `Q${f(p0[0])} ${f(p0[1])} ${f(mx)} ${f(my)}`;
  }
  return d + 'Z';
}

export function centrelinePath(built, step = 4) {
  const pts = built.centre.filter((_, k) => k % step === 0 || k === built.centre.length - 1);
  if (pts.length < 2) return '';
  let d = `M${f(pts[0][0])} ${f(Math.min(pts[0][1], ARTBOARD.h))}`;
  for (let k = 0; k < pts.length - 1; k++) {
    const p0 = pts[Math.max(0, k - 1)], p1 = pts[k], p2 = pts[k + 1], p3 = pts[Math.min(pts.length - 1, k + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(Math.min(c1[1], ARTBOARD.h))} ${f(c2[0])} ${f(Math.min(c2[1], ARTBOARD.h))} ${f(p2[0])} ${f(Math.min(p2[1], ARTBOARD.h))}`;
  }
  return d;
}

export function blobPath(h, rand) {
  const lumps = h.lumps ?? 9;
  const rx = h.rx ?? h.r, ry = h.ry ?? h.r;
  const rot = ((h.rot ?? 0) * Math.PI) / 180;
  const nz = smoothNoise1D(rand, 1.6, lumps + 4);
  const jag = h.jag ?? 0;
  const taper = h.taper ?? 0;
  const pts = [];
  for (let k = 0; k < lumps; k++) {
    const a = (k / lumps) * Math.PI * 2;
    const bristle = h.bristle ? h.bristle * (k % 2 ? 1 : -0.35) * (0.6 + 0.8 * rand()) : 0;
    const r = 1 + (h.rough ?? 0.1) * nz(k) + jag * (rand() * 2 - 1) + bristle;
    let x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r;
    x *= 1 - taper * (-y / ry) * 0.5;
    pts.push([h.cx + x * Math.cos(rot) - y * Math.sin(rot), h.cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return smoothClosed(pts);
}

function scatterDots(head, rand) {
  const n = head.scatter;
  const rx = head.rx ?? 15, ry = head.ry ?? head.rx ?? 15;
  const [rMin, rMax] = head.dotR ?? [4, 6.5];
  const dots = [];
  let guard = 0;
  while (dots.length < n && guard++ < 500) {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand());
    let x = Math.cos(a) * rx * d, y = Math.sin(a) * ry * d;
    if (head.dome) y = -Math.abs(y) + ry * 0.12;
    const rt = ((head.rot ?? 0) * Math.PI) / 180;
    [x, y] = [x * Math.cos(rt) - y * Math.sin(rt), x * Math.sin(rt) + y * Math.cos(rt)];
    const r = rMin + rand() * (rMax - rMin);
    const ok = dots.every(([ox, oy, or]) => Math.hypot(x - ox, y - oy) > (r + or) * (head.pack ?? 0.62));
    if (ok) dots.push([x, y, r]);
  }
  return dots;
}

export function headPaths(head, rand) {
  if (head.type === 'leaflet') return leafletPath(head, rand);
  if (head.type === 'cluster') {
    const parts = [];
    const dots = head.scatter ? scatterDots(head, rand) : head.dots;
    for (const c of dots) {
      const [dx, dy, r] = c;
      parts.push(blobPath({ cx: head.cx + dx, cy: head.cy + dy, r, lumps: 7, rough: 0.14 }, rand));
    }
    return parts.join('');
  }
  return blobPath(head, rand);
}

export function leafletPath(h, rand) {
  const n = h.teeth ?? 7;
  const N = n * 2;
  const L = h.len, W = h.w / 2;
  const dx = Math.cos(h.ang), dy = Math.sin(h.ang);
  const px = -dy, py = dx;
  const bend = h.bend ?? 0;
  const serr = h.serr ?? 0.15;
  const centre = (t) => {
    const b = bend * L * Math.sin(Math.PI * t) * 0.5;
    return [h.x + dx * L * t + px * b, h.y + dy * L * t + py * b];
  };
  const half = (i) => {
    const t = i / N;
    let w = W * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.78)), 0.85);
    if (i > 0 && i < N) w *= i % 2 ? 1 + serr : 1 - serr * 0.5;
    return w * (1 + (rand() - 0.5) * 0.12);
  };
  const side = (sign) => {
    const out = [];
    for (let i = 0; i <= N; i++) {
      const [cx, cy] = centre(i / N);
      const w = half(i) * sign;
      out.push([cx + px * w, Math.min(cy + py * w, ARTBOARD.h)]);
    }
    return out;
  };
  const a = side(1), b = side(-1).reverse();
  const pts = [...a, ...b.slice(1, -1)];
  return 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';
}
