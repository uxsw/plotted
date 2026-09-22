"use client";

/**
 * The scheme-list pane's finishing action — "Generate the scheme" — pinned
 * beneath the growing list of plants (see .c-scheme-list__generate in
 * _scheme-chat.scss) so it's reachable without hunting for it once the list
 * pane is doing its own scrolling on wide screens, and simply the next thing
 * in flow on a stacked mobile layout.
 *
 * Mocked, like the rest of Stage 1: `beginGenerateScheme` flips the context
 * to "generating", this component holds the fake delay (the same split of
 * responsibility ChatPane uses for its own mock turns — timing lives beside
 * the UI that shows it, not in the context), then `finishGenerateScheme`
 * lands it. The real integration swaps GENERATE_MS for an actual save +
 * write-up call; the surrounding state machine doesn't change.
 *
 * What "generating" actually produces — the planting-arrangement / care /
 * maintenance write-up itself — is a separate destination page, out of scope
 * here (see SchemeChat.tsx doc comment: this workspace has no results route
 * yet). This component's job ends at a clear, honest confirmation that the
 * plants are saved and the guide exists — not at building that page.
 */

import { useEffect, useRef } from "react";
import { usePlantScheme } from "./PlantSchemeContext";
import { Icon } from "@/components/ui/Icon";
import buttonStyles from "@/components/ui/Button.module.css";
import clsx from "clsx";

const GENERATE_MS = 1500;

export default function SchemeGenerateAction() {
  const { schemePlants, generationStatus, beginGenerateScheme, finishGenerateScheme } =
    usePlantScheme();
  const timeoutRef = useRef<number | undefined>(undefined);

  // Stage 1 has no real request to cancel, but the workspace itself is
  // route-scoped (see PlantSchemeContext's provider comment) — clearing a
  // pending mock on unmount avoids a setState-after-unmount warning if the
  // gardener navigates away mid-"generation".
  useEffect(() => {
    return () => window.clearTimeout(timeoutRef.current);
  }, []);

  const count = schemePlants.length;
  if (count === 0) return null;

  function handleGenerate() {
    beginGenerateScheme();
    timeoutRef.current = window.setTimeout(finishGenerateScheme, GENERATE_MS);
  }

  return (
    <div className="c-scheme-list__generate" aria-live="polite">
      {generationStatus === "complete" ? (
        <div className="c-scheme-list__generate-done">
          <Icon name="check" size={16} className="c-scheme-list__generate-check" />
          <div>
            <p className="o-type-label c-scheme-list__generate-done-label">Scheme saved</p>
            <p className="minion c-scheme-list__generate-lead">
              These {count} plant{count === 1 ? "" : "s"} are saved, with a full guide to
              arranging, planting and caring for them through the year.
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="minion c-scheme-list__generate-lead">
            Happy with your border? We&apos;ll save these {count} plant{count === 1 ? "" : "s"}{" "}
            and put together your planting guide — how to arrange them, and how to care for them
            through the year.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generationStatus === "generating"}
            aria-busy={generationStatus === "generating"}
            className={clsx(
              buttonStyles["o-button"],
              buttonStyles["o-button--scheme"],
              buttonStyles["o-button--w100"]
            )}
          >
            {generationStatus === "generating" ? (
              <>
                <span className="c-scheme-list__generate-dots" aria-hidden="true">
                  <span className="c-scheme-list__generate-dot" />
                  <span className="c-scheme-list__generate-dot" />
                  <span className="c-scheme-list__generate-dot" />
                </span>
                Generating your planting guide…
              </>
            ) : (
              <>
                <Icon name="sprout" size={16} />
                Generate the scheme
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
