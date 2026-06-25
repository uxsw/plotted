# Plotted — Plant List: Search & Filter
*Spec for Claude Code — medium effort*

---

## Overview

Add a search input with autocomplete and a filter button to the plant list page. All filtering and search is client-side — the full plant list is already fetched on load. No changes to data fetching, pagination, or the existing plant card/list design.

---

## Out of scope

**Do not change:**
- Plant card design, layout, or styling
- List layout or grid behaviour
- Sort controls (if present)
- Any data fetching logic
- Any other page or component

---

## Filter bar

Sits above the existing plant list, below the page header. Two elements in a single row:

1. **Search input** (flex: 1)
2. **Filter button** (fixed width, right of search input)

---

## Search input

- Placeholder: "search plants…"
- Fraunces italic, consistent with existing field styles
- Searches across: `species`, `cultivar`, and all entries in `common_names[]` array
- Matching is case-insensitive, substring (not prefix-only)
- A clear (✕) icon button appears inside the input on the right when the field has a value — clears input and resets results on tap
- On input change: filter the list in real time AND show autocomplete dropdown

### Autocomplete dropdown

- Appears below the search input when query length ≥ 1 and there are matches
- Shows up to 5 results
- Each result shows:
  - Species name (Fraunces italic, ink)
  - The matching common name if the match was on a common name, otherwise the first common name (Inter, ink-soft, smaller)
- Matched substring is highlighted in moss within the result text
- Selecting a result (tap or Enter) populates the input with the species name and filters the list to that plant
- Dropdown closes on selection, on Escape, or on tap/click outside

### Keyboard navigation (autocomplete)

- **Arrow down** from input: moves focus into the autocomplete list, highlights first item
- **Arrow down / Arrow up**: moves between items, wraps at ends
- **Enter**: selects highlighted item
- **Escape**: closes dropdown, returns focus to input
- Highlighted item should have a visible background state (moss-tint)

---

## Filter button

- Icon button, right of search input, consistent size with input height
- Icon: filter/adjustments icon (existing icon library)
- **Default state:** paper-deep background, sand-line border, ink-soft icon
- **Active state (popover open):** moss background, moss border, paper icon
- **Has filter state (filter applied, popover closed):** default colours + small moss dot indicator in top-right corner of button
- Tapping opens/closes the filter popover
- Tapping outside the popover closes it

### Filter popover

- Appears below and right-aligned to the filter button
- Options (one selectable at a time):
  - Flowering now *(flower icon)*
  - Full sun *(sun icon)*
  - Partial shade *(cloud icon)*
  - Full shade *(moon icon)*
  - Full sun / partial shade *(sun-wind or equivalent icon)*
- Each option: icon + label + checkmark (checkmark visible only on active option)
- Selecting an option:
  - Marks it active (checkmark, moss label)
  - Closes the popover
  - Applies the filter
  - Shows active filter pill (see below)
  - Clears any previously active filter
- Selecting the already-active option deselects it (toggle off), clears the filter

### Active filter pill

- Appears below the search row when a filter is active
- Displays the filter name (e.g. "flowering now", "partial shade")
- Fraunces italic, moss-deep text, moss-tint background, moss border, pill shape
- ✕ button on the right — clears the active filter

---

## Filter logic

### Search
Match if `species`, `cultivar`, or **any entry** in `common_names[]` contains the query string (case-insensitive). Searching across the full array is important — plants may have multiple common names.

### Flowering now
Include plant if current month falls within the plant's flowering season, **with a ±1 month window** to account for natural variance. A plant flowering June–August would be included if filtering in May or September.

Handle wrap-around correctly for winter-flowering plants (e.g. `flowering_season_from: 11`, `flowering_season_to: 2`).

Plants with no flowering season set (`flowering_season_from` and `flowering_season_to` both null) are excluded from this filter.

### Sun needs filters
Match plants where `sun_needs` exactly equals the selected value.

### Combined behaviour
Search and filter can be active simultaneously — results must satisfy both. Only one filter option can be active at a time (selecting a new one replaces the previous).

---

## Result count

A small result count sits between the filter bar and the plant list:
- Format: "12 plants" / "1 plant" / "no plants match"
- Fraunces italic, ink-soft, small
- Updates live as search/filter changes

---

## Empty state

When search + filter combination returns no results, show the existing `EmptyState` component or a simple inline message — "no plants match" — centred in the list area. Do not show the regular empty state (no plants added yet) in this context.

---

## Implementation notes

- All filtering is client-side — do not add any new Supabase queries
- `common_names` is a `text[]` column — ensure the full array is included in the existing list query's select if not already
- Use `useRef` for autocomplete item refs to support keyboard navigation focus management
- The ±1 month flowering window should handle month wrap-around (month 0 → 12, month 13 → 1)
- Autocomplete `onMouseDown` should call `event.preventDefault()` to prevent input blur before selection registers
- Keyboard navigation should not interfere with normal tab order outside the autocomplete
