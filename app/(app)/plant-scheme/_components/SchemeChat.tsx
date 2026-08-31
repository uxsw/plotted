"use client";

/**
 * Route component for /plant-scheme/chat.
 *
 * Thin switch: the guarded entry check, then the question flow, then the
 * persistent workspace once the flow completes. There is no separate results
 * route — the workspace IS the destination.
 */

import Link from "next/link";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";
import { usePlantScheme } from "./PlantSchemeContext";
import QuestionFlow from "./QuestionFlow";
import SplitPaneView from "./SplitPaneView";

export default function SchemeChat() {
  const { path, phase } = usePlantScheme();

  if (!path) {
    return (
      <div className="c-scheme-chat">
        <div className="o-stack">
          <h1 className="paragon o-type-display kirk">No scheme in progress</h1>
          <p className="primer o-measure">
            Start a new planting scheme to answer a few questions and build a scheme with
            Plotted.
          </p>
        </div>
        <Link
          href="/plant-scheme"
          className={clsx(buttonStyles["o-button"], buttonStyles["o-button--primary"])}
        >
          Start a planting scheme →
        </Link>
      </div>
    );
  }

  return phase === "scheme" ? <SplitPaneView /> : <QuestionFlow />;
}
