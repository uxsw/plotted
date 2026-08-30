"use client";

/**
 * Segment layout for the conversational planting scheme shell (Stage 1).
 *
 * Its only job is to mount the cross-route state provider. This is a wholly
 * separate top-level segment from /schemes — it deliberately does not sit inside
 * the existing feature's route ancestry, so "this cannot affect the live scheme
 * feature" is true by construction.
 */

import { PlantSchemeProvider } from "./_components/PlantSchemeContext";

export default function PlantSchemeLayout({ children }: { children: React.ReactNode }) {
  return <PlantSchemeProvider>{children}</PlantSchemeProvider>;
}
