"use client";

/**
 * The persistent split-pane experience: conversation + current scheme list,
 * visible together, with no terminal "results" screen. Rendered once the
 * question flow completes (context phase === "scheme").
 */

import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";
import { usePlantScheme } from "./PlantSchemeContext";
import { MOCK_QUESTIONS } from "./mockData";
import ChatPane from "./ChatPane";
import SchemeListPane from "./SchemeListPane";

export default function SplitPaneView() {
  const router = useRouter();
  const { reset } = usePlantScheme();

  function startOver() {
    reset();
    router.push("/plant-scheme");
  }

  return (
    <div className="o-stack">
      <div className="o-row o-row--space-between">
        <div className="o-stack--compact">
          <p className="minion">Placeholder · your planting scheme</p>
          <h1 className="pica o-type-display kirk">Chat &amp; scheme</h1>
        </div>
        <button
          type="button"
          onClick={startOver}
          className={clsx(buttonStyles["o-button"], buttonStyles["o-button--ghost"])}
        >
          Start over
        </button>
      </div>

      <div className="o-surface--info island brevier">
        Placeholder: mocked shell — no AI, no image lookup. Assistant replies are canned; the
        shopping-list toggle doesn&apos;t persist.
      </div>

      <div className="grid gap-4 md:grid-cols-[3fr_2fr] md:items-start">
        <ChatPane />
        <SchemeListPane />
      </div>

      <DebugPanel />

      <Link
        href="/schemes"
        className={clsx(
          buttonStyles["o-button"],
          buttonStyles["o-button--ghost"],
          buttonStyles["o-button--flush-start"]
        )}
      >
        ← Back to planting schemes
      </Link>
    </div>
  );
}

function DebugPanel() {
  const {
    path,
    phase,
    selectedPlantLabels,
    freeTextPlants,
    outcomes,
    quickAnswered,
    finished,
    transcript,
    schemePlants,
  } = usePlantScheme();

  const startingPlants = path === "existing" ? selectedPlantLabels : freeTextPlants;

  const suggestionEntries = transcript.filter(
    (e): e is Extract<typeof e, { kind: "suggestions" }> => e.kind === "suggestions"
  );

  return (
    <details className="o-surface--info island">
      <summary className="brevier">Debug: captured state</summary>
      <div className="minion text-ink-soft" style={{ marginTop: 8 }}>
        <p>Path: {path}</p>
        <p>Phase: {phase}</p>
        <p>Starting plants: {startingPlants.length ? startingPlants.join(", ") : "(none)"}</p>
        <p>Quick answered: {quickAnswered ? "yes" : "no"}</p>
        <p>Finished: {finished ? "yes" : "no"}</p>

        <p style={{ marginTop: 4 }}>Question outcomes:</p>
        <ul style={{ listStyle: "disc", paddingLeft: 20 }}>
          {outcomes.length === 0 && <li>(none)</li>}
          {outcomes.map((o, i) => (
            <li key={i}>
              {MOCK_QUESTIONS[i]?.id ?? `q${i}`}: {o.type}
              {o.type === "answered" ? ` — "${o.answer}"` : ""}
            </li>
          ))}
        </ul>

        <p style={{ marginTop: 4 }}>Scheme list ({schemePlants.length}):</p>
        <ul style={{ listStyle: "disc", paddingLeft: 20 }}>
          {schemePlants.length === 0 && <li>(empty)</li>}
          {schemePlants.map((p) => (
            <li key={p.id}>
              {p.tier} — {p.commonName} · cart: {p.addedToShoppingList ? "yes" : "no"} · id:{" "}
              {p.id}
            </li>
          ))}
        </ul>

        <p style={{ marginTop: 4 }}>Suggestion cards ({suggestionEntries.length}):</p>
        <ul style={{ listStyle: "disc", paddingLeft: 20 }}>
          {suggestionEntries.length === 0 && <li>(none)</li>}
          {suggestionEntries.map((entry) => {
            const addedFromThisCard = schemePlants.filter((p) => p.sourceEntryId === entry.id);
            return (
              <li key={entry.id}>
                {entry.id}: {addedFromThisCard.length}/{entry.plants.length} added
                {addedFromThisCard.length > 0 &&
                  ` [${addedFromThisCard.map((p) => p.plantId).join(", ")}]`}
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
