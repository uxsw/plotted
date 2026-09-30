"use client";

/**
 * Route component for /plant-scheme/chat/[draftId]: seeds the layout-level
 * PlantSchemeProvider from the server-fetched draft row, then renders the same
 * switch as the id-less chat route.
 *
 * Arriving here straight from completeFlow (router.replace), the provider
 * already holds this draft — possibly with newer, not-yet-saved changes than
 * the row the server just read — so it is only hydrated when the ids differ.
 */

import { useLayoutEffect } from "react";
import { usePlantScheme, type PlantSchemeDraftRecord } from "./PlantSchemeContext";
import SchemeChat from "./SchemeChat";

export default function DraftChat({ draft }: { draft: PlantSchemeDraftRecord }) {
  const { draftId, hydrateDraft } = usePlantScheme();
  const ready = draftId === draft.id;

  useLayoutEffect(() => {
    if (!ready) hydrateDraft(draft);
  }, [ready, draft, hydrateDraft]);

  return ready ? <SchemeChat /> : null;
}
