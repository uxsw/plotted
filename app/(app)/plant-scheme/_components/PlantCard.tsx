"use client";

/**
 * One presentational plant card, reused for:
 *  - inline suggestion cards in the chat (action slot = "Add")
 *  - scheme-list items in the list pane (action slot = cart + "Remove")
 *
 * Markup follows the existing scheme suggestion-card style (see the live
 * components/SchemeResults.tsx) so no new visual language is introduced.
 *
 * `photoUrl` is only ever set for Path A garden plants, from the garden record's
 * own stored photo — there is no Wikimedia lookup at this stage. Cards without a
 * photo render exactly as before.
 */

import type { ReactNode } from "react";
import Image from "next/image";

export interface PlantCardData {
  commonName: string;
  latinName: string;
  tier: "back" | "mid" | "ground" | null;
  note: string;
  badges: string[];
  photoUrl?: string | null;
}

export function PlantCard({
  plant,
  actions,
  footer,
}: {
  plant: PlantCardData;
  /** Rendered top-right, aligned with the title. */
  actions?: ReactNode;
  /** Rendered under the badges (e.g. an "added" note). */
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-col overflow-hidden border border-sand-line bg-paper">
      {plant.photoUrl && (
        <div className="relative aspect-[3/2] w-full bg-paper-deep">
          <Image
            src={plant.photoUrl}
            alt={plant.commonName}
            fill
            sizes="(max-width: 860px) 100vw, 320px"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-col gap-1 p-3">
        <div className="o-row o-row--space-between">
          <h3 className="o-type-display long-primer kirk">{plant.commonName}</h3>
          {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
        </div>
        <p className="o-type-display o-type--italic minion text-ink-soft o-type-leading--snug">
          {plant.latinName}
        </p>
        {plant.note && <p className="brevier">{plant.note}</p>}
        {plant.badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {plant.badges.map((b) => (
              <span key={b} className="o-badge is-sm">
                {b}
              </span>
            ))}
          </div>
        )}
        {footer && <div className="mt-1">{footer}</div>}
      </div>
    </div>
  );
}

export function CartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 1.5h1.8l1.4 6.5h6.1l1.4-4.8H4.2" />
      <circle cx="5.8" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9.8" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 6.5l2.5 2.5 5.5-5.5" />
    </svg>
  );
}
