---
name: feedback-dashboard-nav
description: Don't add nav links for new pages until the page has real content, not placeholders
metadata:
  type: feedback
---

Don't add a nav link for a new page until it has real content. Placeholders don't warrant nav exposure — wait until sections are built out and the user explicitly asks for the nav link to be added.

**Why:** User reverted the GlobalNav dashboard link added during Stage 1 (shell/placeholder phase) because the page wasn't ready to be surfaced yet.

**How to apply:** When building a new page in stages, hold off on any navigation wiring (GlobalNav, sidebar, redirects) until the page has substantive content and the user explicitly asks for it.
