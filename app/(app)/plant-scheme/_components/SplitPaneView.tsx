"use client";

/**
 * The persistent workspace: conversation + the scheme list building up beside
 * it, no terminal "results" screen. Rendered once the question flow completes
 * (context phase === "scheme").
 *
 * The .c-scheme-workspace class drops the .o-page product measure so the
 * two-pane workspace fills the full viewport width, and on wide screens
 * sticks the list beside the scrolling chat.
 */

import Link from "next/link";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";
import { usePlantScheme } from "./PlantSchemeContext";
import { MOCK_QUESTIONS } from "./mockData";
import ChatPane from "./ChatPane";
import SchemeListPane from "./SchemeListPane";

export default function SplitPaneView() {
  const { path } = usePlantScheme();

  return (
    <div
      className={clsx(
        "c-scheme-chat c-scheme-workspace",
        path === "existing" ? "is-path-existing" : "is-path-scratch"
      )}
    >
      <div className="c-scheme-workspace__panes">
        <ChatPane />
        <div className="c-scheme-workspace__list">
          <SchemeListPane />
        </div>
      </div>

      {/*
        State-inspection panel — off by default. Turn on with
        NEXT_PUBLIC_PLANT_SCHEME_DEBUG=1 in .env.local and restart the dev server.
      */}
      {process.env.NEXT_PUBLIC_PLANT_SCHEME_DEBUG === "1" && <DebugPanel />}

      <div className="c-scheme-chat__footer">
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
    </div>
  );
}

function DebugPanel() {
  const {
    path,
    phase,
    selectedGardenPlants,
    freeTextPlants,
    outcomes,
    quickAnswered,
    finished,
    transcript,
    schemePlants,
  } = usePlantScheme();

  const startingPlants =
    path === "existing" ? selectedGardenPlants.map((p) => p.commonName) : freeTextPlants;

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
              [{p.origin}] {p.tier ?? "no tier"} — {p.commonName} · photo:{" "}
              {p.photoUrl ? "yes" : "no"} · cart: {p.addedToShoppingList ? "yes" : "no"} · id:{" "}
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
