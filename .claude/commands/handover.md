Write a session handover document to `.claude-notes/handover.md`. Overwrite any existing file — this is always the current session's state.

Gather context by reading recent git history (`git log --oneline -20`), any staged or unstaged changes (`git diff HEAD`), and any files you already know about or worked on this session. Do NOT read every file in the project — only what's needed to be specific.

The handover must be concise and specific. Follow this structure exactly:

---

## Session handover — $DATE

### What was implemented
List each discrete thing built or fixed this session. For each item:
- File path(s) changed
- Component/function names where relevant
- Prop shapes or API signatures if they were added or changed
- One sentence on what it does

No vague summaries like "added styling" — say which component, which CSS class, what visual effect.

### Decisions made
For each non-obvious decision (approach chosen, trade-off accepted, alternative rejected):
- What was decided
- Why (constraint, bug, framework limitation, user preference)

Skip decisions that are self-evident from the code.

### Incomplete or known issues
List anything that was started but not finished, any known bugs, any hacks or workarounds left in place, and any `TODO`/debug code still in the codebase. Be specific about file and line if relevant.

### Immediate next task
One short paragraph describing exactly what the next Claude Code session should do first, including which file to start in if known. If there is no clear next task, write "None identified."

---

After writing the file, confirm the path and print the first few lines so the user can verify it looks right.
