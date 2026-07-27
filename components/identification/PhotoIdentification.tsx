"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AiNoticePanel } from "@/components/ui/AiNoticePanel";
import {
  candidateToPlantFields,
  genusFallbackToPlantFields,
  type IdentifiedPlantFields,
} from "@/lib/identification/name";
import {
  topCandidates,
  confidenceRegister,
  sharedGenus,
} from "@/lib/identification/candidates";
import type { IdentificationCandidate } from "@/lib/identification/types";

// The unit knows nothing about where the chosen name is going — the consumer
// passes the destination in via onSelect. That is what keeps the shopping-list
// journey a new entry point later rather than a refactor of this component.
type Props = {
  photoBlob: Blob;
  /** Whatever the user has already typed, preserved as species_input if it differs. */
  currentSpecies: string;
  onSelect: (fields: IdentifiedPlantFields) => void;
};

type Status = "idle" | "loading" | "results" | "error";

// A selection is either one of the ranked candidates or the genus fallback.
type Selection = { kind: "candidate"; index: number } | { kind: "genus" };

function errorMessage(status: number, body: { error?: string }): string {
  if (status === 504) return "That took too long. Try again in a moment.";
  if (status === 502) return "Couldn't reach the identification service. Try again in a moment.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  return body.error ?? "Something went wrong identifying this photo.";
}

export default function PhotoIdentification({ photoBlob, currentSpecies, onSelect }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [candidates, setCandidates] = useState<IdentificationCandidate[]>([]);
  const [selection, setSelection] = useState<Selection>({ kind: "candidate", index: 0 });
  const [error, setError] = useState<string | null>(null);

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
      setSelection({ kind: "candidate", index: 0 }); // top result pre-selected
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

  const shown = topCandidates(candidates);
  const genus = sharedGenus(candidates);

  // Selecting an option applies it immediately — there is no separate confirm
  // step. This fires even for the pre-selected top card, which is a visual
  // default only: nothing is written to the species field until the user
  // actively picks one, so results appearing doesn't silently overwrite
  // whatever they'd already typed.
  function choose(next: Selection) {
    setSelection(next);
    const fields =
      next.kind === "genus"
        ? genusFallbackToPlantFields(genus ?? "", currentSpecies)
        : candidateToPlantFields(shown[next.index], currentSpecies);
    onSelect(fields);
    dismiss();
  }

  if (status === "idle" || status === "loading" || status === "error") {
    return (
      <div className="c-identify mt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={identify}
          disabled={status === "loading"}
          className="w-full justify-center"
        >
          {status === "loading" ? "Identifying…" : "Identify from photo"}
        </Button>
        {error && (
          <p className="c-identify__error text-xs text-clay mt-2" role="alert">
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
      <section className="c-identify-results mt-4" aria-label="Identification results">
        <AiNoticePanel>
          <span>
            We couldn&apos;t match this photo to a plant. Try a closer shot of a leaf or
            flower, or type the name yourself.
          </span>
        </AiNoticePanel>
        <div className="mt-3">
          <Button type="button" variant="ghost" onClick={dismiss} className="w-full justify-center">
            Enter the name myself
          </Button>
        </div>
      </section>
    );
  }

  const register = confidenceRegister(shown[0].score);

  return (
    <section className="c-identify-results mt-4" aria-label="Identification results">
      <AiNoticePanel>
        <span>
          {register === "likely"
            ? "Most likely matches, based on your photo. Have a look and pick the closest."
            : "Best guesses, based on your photo. We're less sure about this one — compare the pictures."}
        </span>
      </AiNoticePanel>

      <div
        className="c-identify-results__options mt-3"
        role="radiogroup"
        aria-label="Suggested plants"
      >
        {/* Top result — emphasised and pre-selected. Larger than the rest so the
            image, not the name, is what the user judges. */}
        <CandidateOption
          candidate={shown[0]}
          selected={selection.kind === "candidate" && selection.index === 0}
          onSelect={() => choose({ kind: "candidate", index: 0 })}
          emphasis
        />

        {shown.length > 1 && (
          <div className="c-identify-results__alternatives grid grid-cols-2 gap-3 mt-3">
            {shown.slice(1).map((candidate, i) => (
              <CandidateOption
                key={candidate.scientificName}
                candidate={candidate}
                selected={selection.kind === "candidate" && selection.index === i + 1}
                onSelect={() => choose({ kind: "candidate", index: i + 1 })}
              />
            ))}
          </div>
        )}

        {genus && (
          <button
            type="button"
            role="radio"
            aria-checked={selection.kind === "genus"}
            onClick={() => choose({ kind: "genus" })}
            className={`c-identify-results__genus w-full text-left mt-3 rounded-[10px] border px-4 py-3 ${
              selection.kind === "genus"
                ? "border-ink ring-2 ring-ink"
                : "border-sand-line"
            }`}
          >
            <span className="font-display text-base">{genus} — species uncertain</span>
            <span className="block font-sans text-xs text-ink-soft mt-0.5">
              Right plant family, but we can&apos;t tell which one. You can narrow it down later.
            </span>
          </button>
        )}
      </div>

      <div className="c-identify-results__actions mt-4">
        <Button type="button" variant="ghost" onClick={dismiss} className="w-full justify-center">
          None of these
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
      className={`c-identify-option block w-full text-left rounded-[10px] overflow-hidden border ${
        selected ? "border-ink ring-2 ring-ink" : "border-sand-line"
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
