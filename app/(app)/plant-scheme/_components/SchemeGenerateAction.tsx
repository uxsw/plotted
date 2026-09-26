"use client";

/**
 * The scheme-list pane's finishing action — "Generate the scheme" — pinned
 * beneath the growing list of plants (see .c-scheme-list__generate in
 * _scheme-chat.scss) so it's reachable without hunting for it once the list
 * pane is doing its own scrolling on wide screens, and simply the next thing
 * in flow on a stacked mobile layout.
 *
 * Real save: it flushes any pending draft writes, POSTs
 * /api/plant-scheme/[draftId]/save (which returns at once and generates in the
 * background), then polls /api/schemes/[id]/status — the same endpoint the
 * /schemes generating page polls — and opens the finished scheme at
 * /schemes/[id] when it lands. The list and chat are locked while it runs
 * (see PlantSchemeContext), so what's generated is what's on screen.
 *
 * On failure the draft is untouched and the button becomes "Try again". After
 * a refresh mid-save the context hands back the in-flight scheme id
 * (`resumeSchemeId`) and polling simply resumes.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlantScheme } from "./PlantSchemeContext";
import { Icon } from "@/components/ui/Icon";
import buttonStyles from "@/components/ui/Button.module.css";
import { STALE_GENERATING_MS } from "@/lib/scheme-generation-timing";
import clsx from "clsx";

const POLL_INTERVAL_MS = 3000;

const SAVE_FAILED_MESSAGE =
  "We couldn't save your scheme this time. Your plants and conversation are safe — please try again.";
const DRAFT_STALE_MESSAGE =
  "We couldn't save your latest changes. Check your connection and try again.";

export default function SchemeGenerateAction() {
  const {
    schemePlants,
    generationStatus,
    draftId,
    resumeSchemeId,
    flushDraft,
    beginGenerateScheme,
    finishGenerateScheme,
    failGenerateScheme,
  } = usePlantScheme();
  const router = useRouter();
  const [schemeId, setSchemeId] = useState<string | null>(resumeSchemeId);
  const [error, setError] = useState<string | null>(null);

  // Poll the scheme's status while a save is running, from the moment the
  // POST hands back an id (or the page reloaded mid-save) until it settles.
  useEffect(() => {
    if (generationStatus !== "generating" || !schemeId) return;
    let active = true;
    const startedAt = Date.now();

    function settle() {
      active = false;
      window.clearInterval(interval);
    }

    async function poll() {
      if (!active) return;
      // A save nobody is finishing (the server died) shouldn't spin forever.
      if (Date.now() - startedAt > STALE_GENERATING_MS) {
        settle();
        failGenerateScheme();
        return;
      }
      try {
        const res = await fetch(`/api/schemes/${schemeId}/status`);
        if (!active) return;
        if (res.status === 404) {
          settle();
          failGenerateScheme();
          return;
        }
        if (!res.ok) return;
        const { status } = (await res.json()) as { status: string };
        if (!active) return;
        if (status === "complete") {
          settle();
          finishGenerateScheme();
          router.push(`/schemes/${schemeId}`);
        } else if (status === "failed") {
          settle();
          failGenerateScheme();
        }
      } catch {
        // network error — keep polling
      }
    }

    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    poll();
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [generationStatus, schemeId, router, finishGenerateScheme, failGenerateScheme]);

  const count = schemePlants.length;
  if (count === 0) return null;

  async function handleGenerate() {
    setError(null);
    // Locks the list and chat straight away, before the (possibly slow) flush.
    beginGenerateScheme();

    // The server builds the scheme from the draft row, so it must be current.
    if (!draftId || !(await flushDraft())) {
      failGenerateScheme();
      setError(DRAFT_STALE_MESSAGE);
      return;
    }

    try {
      const res = await fetch(`/api/plant-scheme/${draftId}/save`, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { scheme_id?: string; status?: string };
      if (!res.ok || !json.scheme_id) throw new Error("save failed");

      if (json.status === "complete") {
        finishGenerateScheme();
        router.push(`/schemes/${json.scheme_id}`);
        return;
      }
      setSchemeId(json.scheme_id);
    } catch {
      failGenerateScheme();
      setError(SAVE_FAILED_MESSAGE);
    }
  }

  const failed = generationStatus === "failed";

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
          {failed && (
            <p className="minion c-scheme-list__generate-lead" role="alert">
              {error ?? SAVE_FAILED_MESSAGE}
            </p>
          )}
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
                {failed ? "Try again" : "Generate the scheme"}
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
