"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AiNoticePanel } from "@/components/ui/AiNoticePanel";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";
import {
  candidateToPlantFields,
  unidentifiedPlantFields,
  type IdentifiedPlantFields,
} from "@/lib/identification/name";
import {
  topCandidates,
  confidenceRegister,
  sharedGenus,
} from "@/lib/identification/candidates";
import type { IdentificationCandidate } from "@/lib/identification/types";
import { logIdentificationChoice } from "@/app/actions/identification";

// The unit knows nothing about where the chosen name is going — the consumer
// passes the destination in via onSelect. That is what keeps the shopping-list
// journey a new entry point later rather than a refactor of this component.
//
// onSelect now performs the actual save (upload + upsertPlant + redirect),
// not just a state update — every outcome here (a candidate, or "none of
// these") ends the add-plant journey directly, with nothing left on the
// form for the user to usefully review. A resolving promise means the
// save failed (upsertPlant's redirect() never returns to the caller on
// success — the browser just navigates away).
type Props = {
  photoBlob: Blob;
  /** Whatever the user has already typed, preserved as species_input if it differs. */
  currentSpecies: string;
  onSelect: (fields: IdentifiedPlantFields) => Promise<void>;
  /** Reports whether populated candidate results are currently on screen, so
   * the consumer can hide its own manual-entry escape hatch while this unit
   * is showing "pick a card" — manual entry isn't needed at this step. */
  onResultsChange?: (hasResults: boolean) => void;
};

type Status = "idle" | "loading" | "results" | "saving" | "error";

// Placeholder copy pending review by Natalie (brand/copy) — keep it here,
// in one place, so it's easy to find and swap later.
const IDENTIFY_COPY = {
  likely: "Most likely matches, based on your photo. Have a look and pick the closest.",
  guess: "Best guesses, based on your photo. We're less sure about this one - compare the pictures.",
  genusLine: (genus: string) => `${genus} — species uncertain`,
  tapToSelect: "Tap the result that matches your plant.",
};

function errorMessage(status: number, body: { error?: string }): string {
  if (status === 504) return "That took too long. Try again in a moment.";
  if (status === 502) return "Couldn't reach the identification service. Try again in a moment.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 429) return "You've reached today's identification limit. Try again tomorrow, or enter the name yourself.";
  return body.error ?? "Something went wrong identifying this photo.";
}

export default function PhotoIdentification({ photoBlob, currentSpecies, onSelect, onResultsChange }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [candidates, setCandidates] = useState<IdentificationCandidate[]>([]);
  const [selection, setSelection] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const shownForEffect = topCandidates(candidates);
  const hasResults = status === "results" && shownForEffect.length > 0;
  useEffect(() => {
    onResultsChange?.(hasResults);
  }, [hasResults, onResultsChange]);

  async function identify() {
    setStatus("loading");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", photoBlob, "photo.jpg");
      const res = await fetch("/api/identify", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        setError(errorMessage(res.status, json));
        setStatus("error");
        return;
      }

      setCandidates(json.candidates ?? []);
      setSelection(0); // top result pre-selected
      setStatus("results");
    } catch {
      setError("Couldn't reach the identification service. Check your connection and try again.");
      setStatus("error");
    }
  }

  function dismiss() {
    setStatus("idle");
    setCandidates([]);
    setError(null);
  }

  const shown = shownForEffect;
  const genus = sharedGenus(candidates);

  // Selecting an option saves directly — there is no separate confirm step
  // and no return to the form. This fires even for the pre-selected top
  // card, which is a visual default only: nothing is saved until the user
  // actively picks one.
  async function choose(index: number) {
    setSelection(index);
    const fields = candidateToPlantFields(shown[index], currentSpecies);
    void logIdentificationChoice(shown[0].scientificName, shown[index].scientificName);

    setStatus("saving");
    setError(null);
    try {
      await onSelect(fields);
      // Success redirects to the new plant's detail page from inside
      // onSelect (upsertPlant's redirect()) — the browser navigates away
      // before this line would run.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this plant. Try again.");
      setStatus("results");
    }
  }

  // "None of these" is itself the signal this logs — not skipped, not an
  // error. Only reachable from the populated-results view below, so
  // shown[0] always exists here. Saves directly as unidentified rather than
  // returning to manual entry — see spec's "identification failure is never
  // a dead end".
  async function rejectAll() {
    void logIdentificationChoice(shown[0].scientificName, null);
    setStatus("saving");
    setError(null);
    try {
      await onSelect(unidentifiedPlantFields());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this plant. Try again.");
      setStatus("results");
    }
  }

  if (status === "saving") {
    return (
      <div className="c-identify" role="status">
        <p className="text-sm text-ink-soft">Saving your plant…</p>
      </div>
    );
  }

  if (status === "idle" || status === "loading" || status === "error") {
    return (
      <div>
        <Button
          type="button"
          onClick={identify}
          disabled={status === "loading"}
          className={clsx(
            buttonStyles["o-button"],
            buttonStyles["o-button--outline"],
            buttonStyles["o-button--w100"]
          )}
        >
          {status === "loading" ? "Identifying…" : "Identify from photo"}
        </Button>
        {error && (
          <p className="o-surface--error island primer u-margin-block-start" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  // No usable results — not an error, just nothing to offer. Fall through to
  // manual entry rather than leaving the user at a dead end.
  if (shown.length === 0) {
    return (
      <section className="o-surface-info has-border island o-stack" aria-label="Identification results">
        <p className="long-primer o-type-display">We couldn&apos;t match this photo to a plant.</p>
        <p className="brevier">You can still save the plant as <em>unidentified</em>. We&apost;re constantly working on our plant identification featues so might be able to give you a better answer in future.</p>
        <Button
          type="button"
          className={clsx(
            buttonStyles["o-button"],
            buttonStyles["o-button--outline"],
            buttonStyles["o-button-w100"]
          )}
          onClick={dismiss}
        >
          Save as unidentified
        </Button>
      </section>
    );
  }

  const register = confidenceRegister(shown[0].score);

  return (
    <section className="c-identify-results o-stack" aria-label="Identification results">
      {error && (
        <p className="o-surface--error island primer" role="alert">
          {error}
        </p>
      )}
      <AiNoticePanel>
        <div>
          {genus && (
            <p className="long-primer o-type-display">{IDENTIFY_COPY.genusLine(genus)}</p>
          )}
          <p className="brevier">{register === "likely" ? IDENTIFY_COPY.likely : IDENTIFY_COPY.guess}</p>
        </div>
      </AiNoticePanel>

      <p className="brevier">{IDENTIFY_COPY.tapToSelect}</p>

      <div
        className="c-identify-results__options"
        role="radiogroup"
        aria-label="Suggested plants"
      >
        {/* Top result — emphasised and pre-selected. Larger than the rest so the
            image, not the name, is what the user judges. */}
        <CandidateOption
          candidate={shown[0]}
          selected={selection === 0}
          onSelect={() => choose(0)}
          emphasis
        />

        {shown.length > 1 && (
          <div className="is-options">
            {shown.slice(1).map((candidate, i) => (
              <CandidateOption
                key={candidate.scientificName}
                candidate={candidate}
                selected={selection === i + 1}
                onSelect={() => choose(i + 1)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="o-surface-info has-border island o-stack">
        <p className="long-primer o-type-display">Still not convinced?</p>
        <p className="brevier">Save the plant as <em>unidentified</em>. We&apost;re constantly working on our plant identification featues so might be able to give you a better answer in future.</p>
        <Button
          type="button"
          onClick={rejectAll}
          className={clsx(
              buttonStyles["o-button"],
              buttonStyles["o-button--outline"]
            )}
        >
          Continue
        </Button>
      </div>

      {/* Required Pl@ntNet credit. Belongs here, where the suggestions are
          actually being used — deliberately not on the plant detail page. */}
      <p className="c-identify-results__attribution minion text-ink-soft mt-3">
        Plant suggestions powered by{" "}
        <a
          href="https://plantnet.org"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Pl@ntNet
        </a>
      </p>
    </section>
  );
}

function CandidateOption({
  candidate,
  selected,
  onSelect,
  emphasis = false,
}: {
  candidate: IdentificationCandidate;
  selected: boolean;
  onSelect: () => void;
  emphasis?: boolean;
}) {
  // Common name leads because it is the part a non-botanist can act on; the
  // scientific name sits underneath as supporting detail.
  const commonName = candidate.commonNames[0];
  const title = commonName ?? candidate.scientificName;
  const subtitle = commonName ? candidate.scientificName : candidate.family;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`c-identify-option ${
        selected ? "is-selected" : "is-default"
      } ${emphasis ? "c-identify-option--emphasis" : ""}`}
    >
      <Card
        photoUrl={candidate.referenceImages[0] ?? null}
        photoAlt={`Reference photo of ${candidate.scientificName}`}
        title={title}
        subtitle={subtitle}
      />
    </button>
  );
}
