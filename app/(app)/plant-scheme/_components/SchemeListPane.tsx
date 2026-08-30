"use client";

/**
 * The scheme-list half of the persistent split-pane view.
 *
 * Shows plants the user has explicitly added, grouped by the existing
 * back / mid / ground-cover tiers. Each item has an explicit Remove control and
 * a mocked "add to shopping list" toggle (no network call).
 */

import { usePlantScheme } from "./PlantSchemeContext";
import { MOCK_TIER_LABELS, MOCK_TIER_ORDER } from "./mockData";
import { PlantCard, CartIcon, CheckIcon } from "./PlantCard";

export default function SchemeListPane() {
  const { schemePlants, removeSchemePlant, toggleShoppingList } = usePlantScheme();

  const tiers = MOCK_TIER_ORDER.map((tier) => ({
    tier,
    items: schemePlants.filter((p) => p.tier === tier),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="o-stack--compact min-w-0">
      <div className="o-row o-row--space-between">
        <h2 className="long-primer kirk o-type-display">Scheme list</h2>
        <span className="minion">
          {schemePlants.length} plant{schemePlants.length === 1 ? "" : "s"}
        </span>
      </div>

      {schemePlants.length === 0 ? (
        <div className="o-surface--info island brevier">
          Placeholder: nothing added yet — add suggestions from the conversation and they&apos;ll
          appear here, grouped by tier.
        </div>
      ) : (
        <div className="o-stack--compact">
          {tiers.map(({ tier, items }) => (
            <div key={tier} className="o-stack--compact">
              <h3 className="brevier text-ink-soft">{MOCK_TIER_LABELS[tier]}</h3>
              <div className="grid gap-2">
                {items.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    actions={
                      <>
                        <button
                          type="button"
                          onClick={() => toggleShoppingList(plant.id)}
                          aria-label={
                            plant.addedToShoppingList
                              ? `${plant.commonName} added to shopping list`
                              : `Add ${plant.commonName} to shopping list`
                          }
                          aria-pressed={plant.addedToShoppingList}
                          className="flex items-center justify-center w-6 h-6 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                        >
                          {plant.addedToShoppingList ? <CheckIcon /> : <CartIcon />}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSchemePlant(plant.id)}
                          aria-label={`Remove ${plant.commonName} from scheme`}
                          className="minion text-ink-soft hover:text-ink px-1"
                        >
                          Remove
                        </button>
                      </>
                    }
                    footer={
                      plant.addedToShoppingList ? (
                        <p className="minion text-ink-soft">
                          Placeholder: on shopping list (mock — not saved).
                        </p>
                      ) : null
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
