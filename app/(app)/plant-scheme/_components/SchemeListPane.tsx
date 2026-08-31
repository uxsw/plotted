"use client";

/**
 * The scheme-list half of the workspace — the plants that make the scheme,
 * accumulating as the user adds from the conversation.
 *
 * Plants land here two ways:
 *  - Path A garden plants: pre-populated when the workspace is reached (resolved
 *    records the user deliberately selected). No structural tier, so they sit in
 *    their own "From your garden" group above the tier groups.
 *  - Suggestion-card plants: added explicitly from the chat, grouped into the
 *    back / mid / ground-cover tiers.
 *
 * The panel reads as a living border sheet, not a list: the elevation sketch
 * grows a silhouette per tiered plant, the flowering-year strip fills in, and
 * each row carries a specimen-number stamp (the scratch schedule's device,
 * numbered continuously down the sheet). A new row eases in with the
 * accent-wash flash — the workspace's one authored moment, staggered into a
 * "planting" when the sheet first arrives populated.
 *
 * Every item has the same Remove control and a mocked shopping-list toggle.
 */

import { useState } from "react";
import { usePlantScheme } from "./PlantSchemeContext";
import { MOCK_TIER_LABELS, MOCK_TIER_ORDER } from "./mockData";
import { PlantCard, CartIcon, CheckIcon } from "./PlantCard";
import BorderElevation from "./BorderElevation";
import FloweringYear from "./FloweringYear";
import type { SchemePlant } from "./PlantSchemeContext";

export default function SchemeListPane() {
  const { schemePlants, removeSchemePlant, toggleShoppingList } = usePlantScheme();

  /* Rows present on first render arrive as a staggered planting; a row added
     later eases in alone, immediately. Lazy state, captured once at mount. */
  const [initialIds] = useState(() => new Set(schemePlants.map((p) => p.id)));

  const gardenPlants = schemePlants.filter((p) => p.origin === "garden");
  const tierGroups = MOCK_TIER_ORDER.map((tier) => ({
    tier,
    label: MOCK_TIER_LABELS[tier],
    items: schemePlants.filter((p) => p.tier === tier),
  })).filter((g) => g.items.length > 0);

  const groups: { key: string; label: string; items: SchemePlant[] }[] = [
    ...(gardenPlants.length > 0
      ? [{ key: "garden", label: "From your garden", items: gardenPlants }]
      : []),
    ...tierGroups.map((g) => ({ key: g.tier, label: g.label, items: g.items })),
  ];

  /* Specimen numbers run continuously down the sheet, across groups. */
  let specimenNo = 0;

  return (
    <section className="c-scheme-list" aria-label="Scheme list">
      <div className="c-scheme-list__head">
        <span className="o-type-label">Scheme list</span>
        <span className="o-type-label c-scheme-list__count">
          {schemePlants.length} plant{schemePlants.length === 1 ? "" : "s"}
        </span>
      </div>

      <BorderElevation plants={schemePlants} />
      <FloweringYear plants={schemePlants} />

      {schemePlants.length === 0 ? (
        <p className="c-scheme-list__empty brevier">
          Add plants from the conversation and they&apos;ll gather here — the sketch above
          fills in as the border takes shape.
        </p>
      ) : (
        <div className="c-scheme-list__body">
          {groups.map((group) => (
            <div key={group.key} className="c-scheme-list__group">
              <h3 className="c-scheme-list__group-label o-type-label">{group.label}</h3>
              <div className="o-stack--compact">
                {group.items.map((plant) => {
                  specimenNo += 1;
                  const delay = initialIds.has(plant.id) ? (specimenNo - 1) * 70 : 0;
                  return (
                    <div
                      key={plant.id}
                      className="c-scheme-list__item"
                      style={{ "--_delay": `${delay}ms` } as React.CSSProperties}
                    >
                      <span className="c-scheme-list__no minion" aria-hidden="true">
                        {specimenNo}
                      </span>
                      <PlantCard
                        plant={plant}
                        actions={
                          <>
                            <button
                              type="button"
                              onClick={() => toggleShoppingList(plant.id)}
                              aria-label={
                                plant.addedToShoppingList
                                  ? `${plant.commonName} is on your shopping list`
                                  : `Add ${plant.commonName} to your shopping list`
                              }
                              aria-pressed={plant.addedToShoppingList}
                              className="c-suggestion__cart"
                            >
                              {plant.addedToShoppingList ? <CheckIcon /> : <CartIcon />}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSchemePlant(plant.id)}
                              aria-label={`Remove ${plant.commonName} from the scheme`}
                              className="c-suggestion__remove minion"
                            >
                              Remove
                            </button>
                          </>
                        }
                        footer={
                          plant.addedToShoppingList
                            ? "On your shopping list (preview — not saved)."
                            : null
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
