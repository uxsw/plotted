"use client";

/**
 * The hub's start panel: the one step between "I want a scheme" and the
 * conversation. It merges the old two paths — pick from your garden, or type
 * what you're considering — into a single starting tray, because the only
 * difference between them was where a plant came from.
 *
 * Two parts, rendered as siblings rather than one box (see
 * `.c-scheme-start-group` in the SCSS): a compact tray card (this file,
 * `.c-scheme-start`) holding the decisive bits — what's chosen, and the
 * Start button — and GardenGallery.tsx, an open, wide browsing surface for
 * the rest of the garden. They used to share one bordered white sheet; a
 * gallery of dozens of plant photos wants room the tray's compact card
 * shouldn't have to stretch to, so the gallery now breaks out past the
 * page's own measure while the tray stays put.
 *
 * One field (in GardenGallery) does both jobs: typing filters the garden
 * grid, and a name that isn't in the garden can be added as a plant you're
 * considering. The two kinds keep their spec behaviour downstream
 * (PlantSchemeContext `startScheme`): garden plants are resolved records and
 * start on the scheme list; typed names have no identity yet, so they only
 * inform the chat.
 *
 * The tray filling is the hub's one authored moment (`scheme-pick-in`).
 *
 * Styles: `.c-scheme-start` / `.c-garden-gallery` in
 * styles/components/_scheme-hub.scss.
 */

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import clsx from "clsx";
import { plantDisplayTitle } from "@/lib/plantName";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";
import type { Plant } from "@/lib/types";
import { usePlantScheme, type GardenPlantRef } from "./PlantSchemeContext";
import GardenGallery from "./GardenGallery";

const MAX_PLANTS = 5;

export type PickerPlant = Pick<
  Plant,
  "id" | "photo_url" | "genus" | "species" | "cultivar" | "common_names"
>;

type StartingPlant =
  | { kind: "garden"; key: string; name: string; plant: PickerPlant }
  | { kind: "typed"; key: string; name: string };

function latinName(p: PickerPlant): string {
  const binomial = [p.genus, p.species].filter(Boolean).join(" ").trim();
  return p.cultivar ? `${binomial} '${p.cultivar}'`.trim() : binomial;
}

function toRef(p: PickerPlant): GardenPlantRef {
  return {
    plantId: p.id,
    commonName: plantDisplayTitle(p),
    latinName: latinName(p) || plantDisplayTitle(p),
    photoUrl: p.photo_url,
  };
}

export default function StartPanel({ plants }: { plants: PickerPlant[] | null }) {
  const router = useRouter();
  const { startScheme } = usePlantScheme();
  const [picks, setPicks] = useState<StartingPlant[]>([]);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const ids = {
    title: useId(),
    tray: useId(),
    field: useId(),
    fieldNote: useId(),
    garden: useId(),
  };

  const garden = useMemo(() => plants ?? [], [plants]);
  const full = picks.length >= MAX_PLANTS;
  const trimmed = query.trim();
  const needle = trimmed.toLowerCase();

  const matches = useMemo(() => {
    if (!needle) return garden;
    return garden.filter((p) =>
      `${plantDisplayTitle(p)} ${latinName(p)}`.toLowerCase().includes(needle)
    );
  }, [garden, needle]);

  /* A typed name that is already in the garden selects that record instead —
     a resolved plant is better starting context than a string. */
  const exactGardenMatch = needle
    ? garden.find((p) => plantDisplayTitle(p).toLowerCase() === needle)
    : undefined;
  const alreadyTyped = picks.some((p) => p.kind === "typed" && p.key === `typed:${needle}`);

  function isPicked(plant: PickerPlant) {
    return picks.some((p) => p.key === `garden:${plant.id}`);
  }

  function toggleGarden(plant: PickerPlant) {
    const key = `garden:${plant.id}`;
    setPicks((prev) => {
      if (prev.some((p) => p.key === key)) return prev.filter((p) => p.key !== key);
      if (prev.length >= MAX_PLANTS) return prev;
      return [...prev, { kind: "garden", key, name: plantDisplayTitle(plant), plant }];
    });
  }

  function addFromField() {
    if (!trimmed || full) return;
    if (exactGardenMatch) {
      if (!isPicked(exactGardenMatch)) toggleGarden(exactGardenMatch);
    } else if (!alreadyTyped) {
      setPicks((prev) => [...prev, { kind: "typed", key: `typed:${needle}`, name: trimmed }]);
    }
    setQuery("");
    inputRef.current?.focus();
  }

  function remove(key: string) {
    setPicks((prev) => prev.filter((p) => p.key !== key));
    inputRef.current?.focus();
  }

  function start() {
    if (picks.length === 0) return;
    startScheme(
      picks.flatMap((p) => (p.kind === "garden" ? [toRef(p.plant)] : [])),
      picks.flatMap((p) => (p.kind === "typed" ? [p.name] : []))
    );
    router.push("/plant-scheme/chat");
  }

  const addLabel = exactGardenMatch
    ? isPicked(exactGardenMatch)
      ? null
      : `Add ${plantDisplayTitle(exactGardenMatch)} from your garden`
    : alreadyTyped
      ? null
      : `Add “${trimmed}” as a plant you’re considering`;

  return (
    <div className="c-scheme-start-group">
      <section className="c-scheme-start" aria-labelledby={ids.title}>
        <div className="c-scheme-start__head">
          <h2 id={ids.title} className="pica o-type-display kirk">
            Plan a new scheme
          </h2>
          <p className="brevier c-scheme-start__lead">
            Choose up to five plants to build around. Plotted asks about the spot, then
            suggests plants to go with them, each with a reason.
          </p>
        </div>

        <div className="c-scheme-start__tray">
          <div className="c-scheme-start__row">
            <span id={ids.tray} className="o-type-label">
              Starting plants
            </span>
            <span className="o-type-label c-scheme-start__count">
              {picks.length} / {MAX_PLANTS}
            </span>
          </div>
          <ul className="c-scheme-start__picks" aria-labelledby={ids.tray}>
            {picks.map((pick) => (
              <li key={pick.key} className="c-scheme-start__pick">
                <span className="c-scheme-start__pick-mark">
                  {pick.kind === "garden" && pick.plant.photo_url ? (
                    <Image src={pick.plant.photo_url} alt="" fill sizes="32px" />
                  ) : (
                    <Icon name={pick.kind === "garden" ? "sprout" : "leaf"} size={14} />
                  )}
                </span>
                <span className="c-scheme-start__pick-name brevier">
                  {pick.name}
                  <span className="u-visually-hidden">
                    {pick.kind === "garden" ? " (in your garden)" : " (considering)"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => remove(pick.key)}
                  aria-label={`Remove ${pick.name}`}
                  className="c-scheme-start__pick-remove"
                >
                  <Icon name="close" size={12} />
                </button>
              </li>
            ))}
            {picks.length === 0 && (
              <li className="c-scheme-start__pick is-empty brevier">
                {garden.length === 0
                  ? "Nothing chosen yet. Type a plant name below to get started."
                  : "Nothing chosen yet. Pick from your garden or type a name."}
              </li>
            )}
          </ul>
          {/* The action sits with the tray it acts on — always in the first
              viewport, whatever else the gallery below is doing. */}
          <button
            type="button"
            onClick={start}
            disabled={picks.length === 0}
            className={clsx(
              buttonStyles["o-button"],
              buttonStyles["o-button--primary"],
              buttonStyles["o-button--w100"]
            )}
          >
            {picks.length === 0
              ? "Start the conversation"
              : `Start with ${picks.length} plant${picks.length === 1 ? "" : "s"}`}
            <Icon name="arrowRight" size={16} />
          </button>
        </div>
      </section>

      <GardenGallery
        plants={plants}
        garden={garden}
        matches={matches}
        query={query}
        setQuery={setQuery}
        inputRef={inputRef}
        full={full}
        trimmed={trimmed}
        addLabel={addLabel}
        onSubmitField={addFromField}
        isPicked={isPicked}
        onToggle={toggleGarden}
        ids={ids}
      />
    </div>
  );
}
