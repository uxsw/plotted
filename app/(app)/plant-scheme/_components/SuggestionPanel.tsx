"use client";

/**
 * The "here's a scheme" chat attachment — a titled group of suggestion cards.
 *
 * Above `TIER_GROUP_THRESHOLD` plants (the initial post-Q&A scheme is six),
 * a flat list breaks the cognitive-load ceiling this route holds everywhere
 * else — the choose-one direction panel is exactly four, this was six with
 * no structure. Splitting into the same back/mid/ground tier groups the
 * scheme-list pane already uses turns one 6-item decision into three ≤4-ish
 * chunks that also explain themselves (a plant proposed for "Back of border"
 * carries its own reason for being there). Smaller follow-up panels (two
 * plants) render flat, as before — grouping two cards into groups of one
 * would be noise, not clarity.
 */

import type { ReactNode } from "react";
import { MOCK_TIER_LABELS, MOCK_TIER_ORDER } from "./mockData";
import { PlantCard } from "./PlantCard";
import { Icon } from "@/components/ui/Icon";
import type { ChatEntry, SuggestionPlant } from "./PlantSchemeContext";

const TIER_GROUP_THRESHOLD = 4;

type SuggestionsEntry = Extract<ChatEntry, { kind: "suggestions" }>;

export function SuggestionPanel({
  entry,
  schemePlantIds,
  onAdd,
}: {
  entry: SuggestionsEntry;
  schemePlantIds: string[];
  onAdd: (sourceEntryId: string, plant: SuggestionPlant) => void;
}) {
  const grouped = entry.plants.length > TIER_GROUP_THRESHOLD;

  const groups = grouped
    ? MOCK_TIER_ORDER.map((tier) => ({
        tier,
        label: MOCK_TIER_LABELS[tier],
        plants: entry.plants.filter((p) => p.tier === tier),
      })).filter((g) => g.plants.length > 0)
    : [{ tier: null, label: null, plants: entry.plants }];

  /* A flat delay across every card, grouped or not, so the staggered
     "planting" entrance reads as one wave landing rather than several
     separate ones — computed up front rather than mutated during render. */
  const delayById = new Map<string, number>();
  groups
    .flatMap((g) => g.plants)
    .forEach((plant, i) => {
      delayById.set(`${entry.id}:${plant.plantId}`, i * 80);
    });

  function renderCard(plant: SuggestionPlant) {
    const compositeId = `${entry.id}:${plant.plantId}`;
    const added = schemePlantIds.includes(compositeId);
    return (
      <div
        key={compositeId}
        className="c-scheme-chat__arrive"
        style={{ "--_delay": `${delayById.get(compositeId)}ms` } as React.CSSProperties}
      >
        <PlantCard
          plant={plant}
          actions={
            added ? (
              <span className="c-suggestion__added minion">
                <Icon name="check" size={12} /> Added
              </span>
            ) : (
              <button
                type="button"
                className="c-suggestion__add brevier"
                onClick={() => onAdd(entry.id, plant)}
              >
                + Add
              </button>
            )
          }
        />
      </div>
    );
  }

  const body: ReactNode = groups.map((group) =>
    group.label ? (
      <div key={group.tier} className="c-chat__panel-group">
        <p className="c-chat__panel-group-label o-type-label">{group.label}</p>
        <div className="o-stack--compact">{group.plants.map(renderCard)}</div>
      </div>
    ) : (
      <div key="flat" className="o-stack--compact">
        {group.plants.map(renderCard)}
      </div>
    )
  );

  return (
    <div className="c-chat__panel">
      <p className="c-chat__panel-title brevier">{entry.title}</p>
      {body}
    </div>
  );
}
