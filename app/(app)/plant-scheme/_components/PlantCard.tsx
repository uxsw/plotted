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
 * Every AI-suggested plant (the common case, both here and on the scheme
 * list) has none — this is a text-only card in that case, in both places.
 * A photo-sized illustrated block was tried here and dropped: too big to
 * scan/select from in the chat, and too primary a placeholder on the scheme
 * list for something we know will never be a real image.
 */

import type { ReactNode } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";

export interface PlantCardData {
  commonName: string;
  latinName: string;
  tier: "back" | "mid" | "ground" | null;
  note: string;
  badges: string[];
  photoUrl?: string | null;
}

/** Map a free-text trait label onto its field-guide mark. Colour used to carry
 *  this distinction; a rainbow of pastel fills read as noise once several sat
 *  on one card, so the badges now share one calm treatment and lead with a
 *  small icon instead — see the .o-badge trait rules in _badge.scss. */
const TRAIT_ICON: Record<string, () => ReactNode> = {
  "wildlife friendly": () => <Icon name="flower" size={10} />,
  pollinators: () => <Icon name="flower" size={10} />,
  "drought tolerant": () => <Icon name="dropletOff" size={10} />,
  edible: () => <Icon name="leaf" size={10} />,
  "british native": () => <Icon name="mappin" size={10} />,
};

function traitIcon(label: string): ReactNode {
  return TRAIT_ICON[label.trim().toLowerCase()]?.() ?? null;
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
        <p className="c-suggestion__latin primer">{plant.latinName}</p>
        {plant.note && <p className="c-suggestion__note brevier">{plant.note}</p>}
        {plant.badges.length > 0 && (
          <div className="c-suggestion__badges">
            {plant.badges.map((b) => (
              <span key={b} className="o-badge is-sm">
                {traitIcon(b)}
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
