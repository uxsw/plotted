# Spec: Auth screens — login, forgot password, create account

## Context
Three auth screens sharing the same design language. The login screen has already been implemented — this task updates the error state treatment on login, and implements forgot password and create account as new screens matching the same visual pattern.

**Effort level: low.** Login is already built; the other two screens follow the exact same layout pattern with different illustrations and copy.

---

## 1. Login screen — error state update only

No layout changes. Two updates:

**A) Replace error box with inline annotation**
Remove the existing red-on-pink error box entirely. Replace with a quiet inline message below the password field:

```
font-family: Fraunces, italic
font-size: 14px
color: var(--clay) / #C2603C
display: flex, align-items: center, gap: 7px
margin-top: 10px
```

Prefix the message with this SVG icon (sprig — two leaves on a stem, 12×14px):

```svg
<svg width="12" height="14" viewBox="0 0 12 14" fill="none">
  <line x1="6" y1="13" x2="6" y2="2" stroke="#C2603C" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M6 9 C6 9 3 8 2 5 C2 5 5 5 6 8Z" stroke="#C2603C" stroke-width="1" fill="none" stroke-linejoin="round"/>
  <path d="M6 6 C6 6 9 5 10 2 C10 2 7 2 6 5Z" stroke="#C2603C" stroke-width="1" fill="none" stroke-linejoin="round"/>
</svg>
```

Message text: "invalid email or password"

**B) Error field treatment**
When the error state is active, the password field label and underline shift to clay (`#C2603C`):
```css
.field.error { border-bottom-color: var(--clay); }
.field.error::after { background: var(--clay); transform: scaleX(1); }
.field.error .field-label { color: var(--clay); }
```

---

## 2. Forgot password screen

Same layout as login. Content order:

1. Botanical illustration (SVG below — flowering stem)
2. Wordmark: "Plotted"
3. Tagline: *"find your way back"*
4. One field: email (same underline style as login)
5. Button: "Send reset link" (full-width btn-primary)
6. One footer link, centred: "back to sign in" (Fraunces italic, moss colour, links back to login)

**Illustration — flowering stem:**

```svg
<svg width="200" height="220" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="100" cy="196" rx="50" ry="5" fill="#E8DFC8"/>
  <path d="M100 194 C100 170 100 140 100 80" stroke="#4F6B4A" stroke-width="2" stroke-linecap="round"/>
  <path d="M100 160 C100 160 74 152 70 132 C70 132 94 130 100 152" stroke="#4F6B4A" stroke-width="1.8" fill="none" stroke-linejoin="round"/>
  <path d="M100 152 C90 146 78 140 72 134" stroke="#4F6B4A" stroke-width="0.8" stroke-linecap="round" opacity="0.5"/>
  <path d="M100 140 C100 140 126 132 130 112 C130 112 106 110 100 132" stroke="#4F6B4A" stroke-width="1.8" fill="none" stroke-linejoin="round"/>
  <path d="M100 132 C112 126 122 118 129 114" stroke="#4F6B4A" stroke-width="0.8" stroke-linecap="round" opacity="0.5"/>
  <path d="M100 80 C96 68 96 58 100 50 C104 58 104 68 100 80Z" stroke="#4F6B4A" stroke-width="1.6" fill="none" stroke-linejoin="round"/>
  <path d="M100 50 C94 42 88 36 86 28 C94 28 100 34 100 42" stroke="#4F6B4A" stroke-width="1.4" fill="none" stroke-linejoin="round"/>
  <path d="M100 50 C106 42 112 36 114 28 C106 28 100 34 100 42" stroke="#4F6B4A" stroke-width="1.4" fill="none" stroke-linejoin="round"/>
  <circle cx="100" cy="22" r="8" stroke="#4F6B4A" stroke-width="1.5" fill="none"/>
  <circle cx="100" cy="22" r="3" fill="#C99A3D"/>
  <path d="M100 14 C98 10 96 6 100 2 C104 6 102 10 100 14" stroke="#4F6B4A" stroke-width="1.2" fill="none" stroke-linejoin="round"/>
  <path d="M108 18 C112 16 116 12 120 14 C118 18 114 20 110 18" stroke="#4F6B4A" stroke-width="1.2" fill="none" stroke-linejoin="round"/>
  <path d="M92 18 C88 16 84 12 80 14 C82 18 86 20 90 18" stroke="#4F6B4A" stroke-width="1.2" fill="none" stroke-linejoin="round"/>
  <path d="M106 28 C108 24 114 22 118 24 C116 28 110 30 106 28" stroke="#4F6B4A" stroke-width="1.2" fill="none" stroke-linejoin="round"/>
  <path d="M94 28 C92 24 86 22 82 24 C84 28 90 30 94 28" stroke="#4F6B4A" stroke-width="1.2" fill="none" stroke-linejoin="round"/>
  <path d="M100 194 C93 194 87 200 80 203" stroke="#4F6B4A" stroke-width="1.4" stroke-linecap="round" fill="none"/>
  <path d="M100 194 C107 194 113 200 120 203" stroke="#4F6B4A" stroke-width="1.4" stroke-linecap="round" fill="none"/>
</svg>
```

**Success state** (after form submission): replace the form with a short confirmation message below the wordmark/tagline — "check your email for a reset link" — in Fraunces italic, ink-soft. No redirect needed.

---

## 3. Create account screen

Same layout as login. Content order:

1. Botanical illustration (SVG below — seedling)
2. Wordmark: "Plotted"
3. Tagline: *"start your garden record"*
4. Fields: email, password, confirm password (same underline style)
5. Button: "Create account" (full-width btn-primary)
6. Footer link, centred: "already have an account? sign in" (Fraunces italic, moss colour)

**Illustration — seedling:**

```svg
<svg width="200" height="220" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="100" cy="196" rx="44" ry="5" fill="#E8DFC8"/>
  <path d="M100 194 C100 178 100 162 100 130" stroke="#4F6B4A" stroke-width="2" stroke-linecap="round"/>
  <path d="M100 168 C100 168 78 160 74 142 C74 142 96 140 100 160" stroke="#4F6B4A" stroke-width="1.8" fill="none" stroke-linejoin="round"/>
  <path d="M100 160 C90 154 80 148 76 144" stroke="#4F6B4A" stroke-width="0.8" stroke-linecap="round" opacity="0.5"/>
  <path d="M100 152 C100 152 122 144 126 126 C126 126 104 124 100 144" stroke="#4F6B4A" stroke-width="1.8" fill="none" stroke-linejoin="round"/>
  <path d="M100 144 C110 138 120 130 125 127" stroke="#4F6B4A" stroke-width="0.8" stroke-linecap="round" opacity="0.5"/>
  <path d="M100 130 C98 118 97 108 100 96 C103 108 102 118 100 130Z" stroke="#4F6B4A" stroke-width="1.6" fill="none" stroke-linejoin="round"/>
  <path d="M100 96 C98 84 97 72 100 60 C103 72 102 84 100 96Z" stroke="#4F6B4A" stroke-width="1.4" fill="none" stroke-linejoin="round"/>
  <path d="M100 60 C99 50 98 42 100 34 C102 42 101 50 100 60Z" stroke="#4F6B4A" stroke-width="1.2" fill="none" stroke-linejoin="round"/>
  <circle cx="100" cy="30" r="4" stroke="#4F6B4A" stroke-width="1.2" fill="none"/>
  <circle cx="100" cy="30" r="1.5" fill="#C99A3D"/>
  <path d="M100 194 C94 194 89 199 83 202" stroke="#4F6B4A" stroke-width="1.3" stroke-linecap="round" fill="none"/>
  <path d="M100 194 C106 194 111 199 117 202" stroke="#4F6B4A" stroke-width="1.3" stroke-linecap="round" fill="none"/>
  <path d="M97 196 C93 200 89 206 86 210" stroke="#4F6B4A" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.6"/>
  <path d="M103 196 C107 200 111 206 114 210" stroke="#4F6B4A" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.6"/>
</svg>
```

**Validation:**
- All three fields required
- Password and confirm password must match — if they don't, show the same inline error treatment as login (sprig icon + clay text) below the confirm password field: "passwords don't match"
- Password minimum length should match whatever is already set in Supabase auth settings

---

## Shared notes

- All three screens use the same page layout: no card, form sits directly on paper background with noise texture
- Wordmark, tagline, fields, buttons and footer links follow identical styling across all three screens
- Use the existing font setup (Fraunces + Inter already configured)
- Do not introduce any new components — all elements exist in the design system already

---

## Acceptance check
- Confirm error sprig icon renders at 12×14px without being blurry or clipped
- Confirm all three illustrations are centred and scale correctly at mobile width (~360px)
- Trigger the forgot password success state and confirm the form is replaced cleanly
- Trigger password mismatch on create account and confirm error renders below confirm password field
