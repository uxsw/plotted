"use client";

/**
 * One plant suggestion card. Reused for:
 *  - inline suggestion cards in the chat (action slot = "Add")
 *  - scheme-list items in the list pane (footer slot = "Remove")
 *
 * The title always has the full card width to itself — `actions` is for a
 * short, compact control only (a badge, an icon button), never anything that
 * competes with the title for space. A control that needs more room belongs
 * in `footer` instead, on its own row below the content.
 *
 * Styles: `.c-suggestion` in styles/components/_scheme-chat.scss.
 *
 * `photoUrl` is only ever set for Path A garden plants, from the garden
 * record's own stored photo — there is no Wikimedia lookup at this stage.
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

/** Map a free-text trait label onto the DESIGN.md `.o-badge` trait colours. */
const TRAIT_CLASS: Record<string, string> = {
  "wildlife friendly": "is-wildlife-friendly",
  pollinators: "is-wildlife-friendly",
  "drought tolerant": "is-drought-tolerant",
  edible: "is-edible",
  "british native": "is-british-native",
};

function badgeClass(label: string): string {
  return TRAIT_CLASS[label.trim().toLowerCase()] ?? "";
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
    <div className="c-suggestion">
      {plant.photoUrl && (
        <div className="c-suggestion__media">
          <Image
            src={plant.photoUrl}
            alt={plant.commonName}
            fill
            sizes="(max-width: 860px) 100vw, 320px"
          />
        </div>
      )}
      <div className="c-suggestion__body">
        <div className="c-suggestion__head">
          <h3 className="c-suggestion__name long-primer">{plant.commonName}</h3>
          {actions && <div className="c-suggestion__actions">{actions}</div>}
        </div>
        <p className="c-suggestion__latin minion">{plant.latinName}</p>
        {plant.note && <p className="c-suggestion__note brevier">{plant.note}</p>}
        {plant.badges.length > 0 && (
          <div className="c-suggestion__badges">
            {plant.badges.map((b) => (
              <span key={b} className={`o-badge is-sm ${badgeClass(b)}`.trim()}>
                {b}
              </span>
            ))}
          </div>
        )}
        {footer && <div className="c-suggestion__footer minion">{footer}</div>}
      </div>
    </div>
  );
}

export function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 6.5l2.5 2.5 5.5-5.5" />
    </svg>
  );
}
