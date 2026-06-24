# Spec: Login page redesign

## Context
The existing login page uses a generic white card on a cool grey background with boxed inputs and a plain title. This task replaces it entirely with a design-language-consistent treatment matching the visual reference (plotted_login_screen in chat history).

The form logic, validation, auth wiring, and error handling are all correct and must not change — this is a visual redesign only.

**Effort level: low.** Visual changes only, no logic changes.

---

## Background

Same paper background as the rest of the app — `var(--paper)` / `#FAF6EC` with the SVG `feTurbulence` noise texture already applied globally. No card wrapper, no separate background colour. The form sits directly on the page.

Remove the existing white card container entirely.

---

## Layout

Single centred column, max-width ~500px, consistent with the rest of the app. Content order top to bottom:

1. Botanical illustration (SVG)
2. Wordmark — "Plotted"
3. Tagline — "your garden, recorded"
4. Email field
5. Password field
6. Sign in button
7. Footer links (forgot password / create account)

---

## Botanical illustration

Inline SVG, centred, approximately 200×220px viewBox. This is the main visual moment of the page — give it generous space above and below (32px top padding, 20px below before the wordmark).

The illustration is a botanical plant with stem, paired leaves at multiple heights with single-stroke midrib veins, a bud tip at the top, a soil ellipse at the base, and simple roots. Use the following SVG path data exactly — do not simplify or regenerate:

```svg
<svg width="200" height="220" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="100" cy="196" rx="60" ry="6" fill="#E8DFC8"/>
  <path d="M100 194 C99 170 98 150 100 110 C101 80 100 60 100 40" stroke="#4F6B4A" stroke-width="2" stroke-linecap="round"/>
  <path d="M100 170 C100 170 72 162 64 140 C64 140 86 134 100 152" stroke="#4F6B4A" stroke-width="1.8" fill="none" stroke-linejoin="round"/>
  <path d="M100 162 C90 156 76 150 66 142" stroke="#4F6B4A" stroke-width="0.8" stroke-linecap="round" opacity="0.5"/>
  <path d="M100 155 C100 155 130 145 138 122 C138 122 114 118 100 138" stroke="#4F6B4A" stroke-width="1.8" fill="none" stroke-linejoin="round"/>
  <path d="M100 147 C112 140 126 132 137 124" stroke="#4F6B4A" stroke-width="0.8" stroke-linecap="round" opacity="0.5"/>
  <path d="M100 130 C100 130 68 118 62 94 C62 94 88 90 100 114" stroke="#4F6B4A" stroke-width="1.8" fill="none" stroke-linejoin="round"/>
  <path d="M100 122 C88 114 74 106 64 96" stroke="#4F6B4A" stroke-width="0.8" stroke-linecap="round" opacity="0.5"/>
  <path d="M100 116 C100 116 134 104 140 78 C140 78 114 76 100 100" stroke="#4F6B4A" stroke-width="1.8" fill="none" stroke-linejoin="round"/>
  <path d="M100 108 C114 100 128 90 139 80" stroke="#4F6B4A" stroke-width="0.8" stroke-linecap="round" opacity="0.5"/>
  <path d="M100 88 C100 88 74 74 72 52 C72 52 96 52 100 76" stroke="#4F6B4A" stroke-width="1.6" fill="none" stroke-linejoin="round"/>
  <path d="M100 80 C90 72 80 62 73 54" stroke="#4F6B4A" stroke-width="0.8" stroke-linecap="round" opacity="0.5"/>
  <path d="M100 72 C100 72 128 60 132 38 C132 38 108 38 100 62" stroke="#4F6B4A" stroke-width="1.6" fill="none" stroke-linejoin="round"/>
  <path d="M100 64 C112 56 124 46 131 40" stroke="#4F6B4A" stroke-width="0.8" stroke-linecap="round" opacity="0.5"/>
  <path d="M100 40 C98 30 96 20 100 12 C104 20 102 30 100 40Z" stroke="#4F6B4A" stroke-width="1.4" fill="none" stroke-linejoin="round"/>
  <path d="M100 194 C92 194 86 200 78 202" stroke="#4F6B4A" stroke-width="1.4" stroke-linecap="round" fill="none"/>
  <path d="M100 194 C108 194 114 200 122 202" stroke="#4F6B4A" stroke-width="1.4" stroke-linecap="round" fill="none"/>
  <path d="M95 196 C90 198 84 204 80 208" stroke="#4F6B4A" stroke-width="1.1" stroke-linecap="round" fill="none" opacity="0.6"/>
  <path d="M105 196 C110 198 116 204 120 208" stroke="#4F6B4A" stroke-width="1.1" stroke-linecap="round" fill="none" opacity="0.6"/>
</svg>
```

---

## Wordmark

```
font-family: Fraunces (display font, already configured)
font-size: 36px
font-weight: 500
color: var(--ink)
text-align: center
margin-bottom: 6px
```

---

## Tagline

```
"your garden, recorded"
font-family: Fraunces, italic
font-size: 15px
font-weight: 400
color: var(--ink-soft)
text-align: center
margin-bottom: 40px
```

---

## Input fields

Underline-only style, matching the add plant form exactly:
- No border box, no background, no border-radius on the input
- Bottom border only: `1px solid var(--sand-line)`
- Focus state: 2px moss line animates in left-to-right via `::after` pseudo-element on the field wrapper (same pattern as the add plant form — see that implementation for reference)
- Labels: Fraunces italic, 15px, `var(--ink-soft)`, lowercase — "email" and "password"
- Input text: Inter, 17px, `var(--ink)`

Field wrapper needs `position: relative` for the focus pseudo-element.

Both fields stacked, no extra gap between them beyond the underline rhythm.

---

## Sign in button

Full-width, existing `btn-primary` component. Label: "Sign in". No changes to button styling.

Margin-top: 32px above the button.

---

## Footer links

Two links on one row, space-between:
- Left: "forgot password?" 
- Right: "create account"

```
font-family: Fraunces, italic
font-size: 14px
color: var(--moss)
```

Wire these to the existing routes/handlers — do not change their destination or behaviour.

---

## What not to change
- Auth logic, form submission, error handling
- Redirect behaviour on successful sign in
- The "forgot password" and "create account" routes
- Any server actions

---

## Acceptance check
- No white card or grey background visible — form sits directly on paper
- Illustration centred and renders cleanly at mobile width
- Focus animation on inputs matches the add plant form behaviour
- Error states (wrong password etc.) still surface correctly — confirm existing error display is preserved even though the surrounding markup changed
