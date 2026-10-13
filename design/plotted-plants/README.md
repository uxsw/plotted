# plotted-plants

Twelve hand-drawn plants (8 tall, 4 low) on a 440 x 620 artboard.

Hand-drawn plant SVGs for the Plotted marketing page. 440 x 620 artboard, plants stand on the bottom edge.

## How it works
- `data/<plant>.json` is the source of truth: hand-authored centrelines (SVG path strings), a width and taper profile per stroke, and flower heads.
- `generate.mjs` adds seeded, low-frequency wobble and tapers each stroke with perfect-freehand (MIT). Same seed = same output.
- Two outputs per plant in `out/`:
  - `<plant>.svg`: tapered fills. `.stems` group (ink) + `.heads` group (separate `.head` paths, recolour with CSS `.head { fill: ... }`).
  - `<plant>.stroke.svg`: stroke-only centrelines, each path has `pathLength="1"` for draw-on animation (`stroke-dasharray: 1; stroke-dashoffset: 1`).
- `validate.mjs` checks artboard size, bottom-edge contact, group structure and bounds.
- `preview.mjs <plants...>` renders PNGs to `preview/` (needs `@resvg/resvg-js`).

## Build
`node generate.mjs && node validate.mjs && node optimize.mjs && node diff.mjs`
- `out/` = readable source output (ids, one path per stroke). `dist/` = optimised files to ship (SVGO, ids stripped, stems merged into one path, each head kept as its own `<path class="head" data-h="N">`).
- `diff.mjs` renders out/ vs dist/ and checks head counts, structure and bottom-edge contact.
- Leaves are filled shapes in `.stems` (`leaves` in the data); heads are `.head` paths.
- Stroke-only layers (`*.stroke.svg`) are written to `out/` when you run `generate.mjs`, but they are NOT shipped in `dist/` or the SVG zip. For a grow-up reveal, mask or clip the filled SVG instead (a rect clipPath animating upward from y=620), then fade/scale the `.head` paths in afterwards.
- Ship only `dist/*.svg`. Keep this source folder out of `public/` (for example `design/plotted-plants/`) so scripts and package.json are never served.

## Workflow
Never hand-edit `out/`. Edit `data/*.json`, then `node generate.mjs && node validate.mjs`.
Per-stroke knobs: `width`, `profile` ([[t, multiplier], ...] along the stroke), `wobble`, `wavelength`, `pinStart`.
Per-plant: `seed`, `wobble`, `width`. Change a seed to reroll the wobble without moving the drawing.
