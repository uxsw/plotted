# Claude Code Prompt — 404 Not Found Page

**Effort: low. New file only, no existing files modified except `globals.css`.**

---

## Task

Create `app/not-found.tsx` and add animation keyframes to `app/globals.css`.

---

## Page Layout

Vertically centred, full viewport height, warm paper background (`bg-paper` or equivalent), max-width ~480px centred horizontally with padding. From top to bottom:

1. SVG illustration (see below)
2. `PAGE NOT FOUND` — small caps label, Inter, tracked wide, muted colour
3. `404` — large display type, Fraunces, ~120px
4. `This page seems to have wandered off` — Fraunces bold, ~28px, dark ink
5. *pagina errante 'Lost Path'* — italic, muted, smaller, Fraunces
6. Body copy — Inter, muted, centred: "The path you followed must have overgrown. It happens — gardens are always changing. Head back to your collection and pick up where you left off."
7. Button — dark rounded pill, `← Back to my plant collection`, links to `/plants`

---

## SVG Illustration

Inline SVG, `width="140" height="180"`, `viewBox="0 0 140 180"`.

### Static elements (outside animated group)

```svg
<rect x="38" y="108" width="64" height="10" rx="5" fill="#C4742A"/>
<path d="M44 118 L96 118 L90 168 L50 168 Z" fill="#C4522A"/>
<ellipse cx="70" cy="118" rx="28" ry="6" fill="#3A2E1E" opacity="0.55"/>
```

### Animated group `<g class="plant-sway">`

```svg
<rect x="67" y="54" width="5" height="58" rx="2.5" fill="#2E5239"/>
<ellipse cx="44" cy="88" rx="22" ry="10" fill="#4A7051" stroke="#2E5239" stroke-opacity="0.4" transform="rotate(-38 44 88)" class="leaf-droop"/>
<g class="plant-sway-slow">
  <ellipse cx="98" cy="72" rx="24" ry="10" fill="#4A7051" stroke="#2E5239" stroke-opacity="0.4" transform="rotate(32 98 72)"/>
</g>
<ellipse cx="62" cy="52" rx="14" ry="7" fill="#4A7051" opacity="0.85" transform="rotate(-18 62 52)" class="leaf-droop"/>
<text x="110" y="58" font-family="Fraunces" font-weight="500" font-size="28" fill="#C4742A" opacity="0.55">?</text>
```

---

## CSS — Add to `app/globals.css`

```css
@keyframes sway {
  0%, 100% { transform: rotate(-2deg); transform-origin: 50% 100%; }
  50%       { transform: rotate(2.5deg); transform-origin: 50% 100%; }
}
@keyframes sway-slow {
  0%, 100% { transform: rotate(1.5deg); transform-origin: 50% 100%; }
  50%       { transform: rotate(-2deg); transform-origin: 50% 100%; }
}
@keyframes droop {
  0%, 100% { transform: rotate(-8deg); transform-origin: 0% 0%; }
  50%       { transform: rotate(-5deg); transform-origin: 0% 0%; }
}
.plant-sway      { animation: sway      5s   ease-in-out infinite; }
.plant-sway-slow { animation: sway-slow 6.5s ease-in-out infinite; }
.leaf-droop      { animation: droop     4.5s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .plant-sway, .plant-sway-slow, .leaf-droop { animation: none; }
}
```

---

## Important — Header Suppression

The current `app/layout.tsx` likely renders the site header on all pages including 404. The 404 page should not show the site header. Check whether `not-found.tsx` at the app root renders inside the main layout, and if so use a minimal layout override to suppress the header on this page only.

---

## Out of Scope

- No changes to any page other than `not-found.tsx`
- No changes to layout for other pages
- No new dependencies

---

**Commit message:** `feat: add 404 not-found page with animated botanical illustration`
