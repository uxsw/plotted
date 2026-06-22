@AGENTS.md

## Session handoff notes
When asked to write a handoff/session-summary doc, save it to `.claude-notes/` (gitignored) rather than `docs/` or anywhere else in the tracked repo. These are working notes for session continuity, not project documentation. If a handoff note surfaces a genuinely durable decision or convention worth keeping, add it directly to this file (CLAUDE.md) instead — don't leave it sitting only in a handoff note.

## Inline editable field hover pattern:
Editable values use padding: 6px 8px with margin-left: -8px to give the hover background (rgba(226,234,221,0.6)) visual breathing room without shifting text position. Never apply the background without the compensating padding/margin — it will clip against the text edge.