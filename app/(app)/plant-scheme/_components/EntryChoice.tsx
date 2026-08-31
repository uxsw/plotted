"use client";

/* ──────────────────────────────────────────────────────────────────────────
   PLANT-SCHEME ENTRY — "The Opening Plate"            direction: authored

   THESIS  The front door to the planting-scheme journey is the opening
   spread of a nursery catalogue: one luminous full-measure photograph of a
   real, abundant garden that makes the promise, then two crisp choice
   plates — each washed in a flowering-season colour — that make the next
   step obvious. It refuses the monochrome sand-on-sand card pair it
   replaces: colour and abundance up front, catalogue order underneath.

   OWN-WORLD  Plotted's Living Catalogue, unchanged — Fraunces roman 600
   headings, Inter body, Spline mono for the plate number; warm paper
   ground, hairline structure. What this one surface spends that the rest
   of the app holds back: a real garden photograph at full measure with an
   overlaid plate number and italic caption (DESIGN.md Image Plate), and
   the sanctioned --sem-flowering-* palette used as large soft colour
   fields — summer pink for the established garden, spring green for the
   one just starting — routed through object-private --_* props, never as
   raw chrome accents.

   STORY  A gardener arrives wanting to plan something lovely. The
   photograph says: this is what we are here for. The two plates say:
   start from the plants you grow, or from scratch — one glance, one
   click, the journey begun.

   FIRST VIEWPORT  Full-measure hero photograph (garden-hero-2 — the
   evening path into a cottage border), ~16:10, rounded, edge-to-edge on a
   phone. Overlaid: a faded "001" plate number top-right; a warm bottom
   scrim carrying the Fraunces canon headline "Start a planting scheme", a
   one-line lead, a hairline, and an italic caption. Below, on the paper
   ground, the two season-washed choice plates side by side (stacking
   under ~40rem), each engraving blooming and its field deepening on
   hover, a "Start →" affordance. Then the back link, flush-start.

   FORM  Authored redesign of one surface inside the established world; no
   concept roll — the user delegated the direction explicitly ("everything
   is up for grabs … I trust you"). Contract lives here, not in the root
   layout, because the change is scoped to this component.

   FINISH  unreviewed and undocumented is unfinished; this build ends with
   the finish review, the verdict, DESIGN.md, and every shipping raster
   carrying its provenance. (Hero raster: garden-hero-2.jpg — team-supplied
   garden photography, pre-existing in /public, not generated.)
   ────────────────────────────────────────────────────────────────────── */

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { usePlantScheme } from "./PlantSchemeContext";
import { EstablishedBedMark, BarePlotMark } from "./marks";
import buttonStyles from "@/components/ui/Button.module.css";

export default function EntryChoice() {
  const router = useRouter();
  const { choosePath, reset } = usePlantScheme();

  function start(path: "existing" | "scratch") {
    reset();
    choosePath(path);
    router.push(`/plant-scheme/${path}`);
  }

  return (
    <div className="c-scheme-entry">
      <div className="c-scheme-hero">
        <Image
          src="/garden-hero-2.jpg"
          alt="An evening view down a stone path through a full cottage-garden border, hills beyond"
          fill
          priority
          quality={70}
          sizes="(max-width: 52rem) 100vw, 800px"
          className="c-scheme-hero__img"
        />
        <span className="c-scheme-hero__scrim" aria-hidden="true" />
        <div className="c-scheme-hero__copy">
          <h1 className="canon o-type-display kirk c-scheme-hero__title">
            Start a planting scheme
          </h1>
          <p className="primer c-scheme-hero__lead">
            Plan a border, a bed, or the whole garden — from the plants you already
            grow, or from scratch.
          </p>
          <span className="c-scheme-hero__rule" aria-hidden="true" />
          <span className="c-scheme-hero__caption" aria-hidden="true">
            <span className="o-type--italic">A cottage border at midsummer, evening</span>
            <span className="o-type-label">001</span>
          </span>
        </div>
      </div>

      <div className="c-scheme-entry__plates">
        <button
          type="button"
          onClick={() => start("existing")}
          className="c-scheme-plate is-established"
        >
          <span className="c-scheme-plate__field">
            <EstablishedBedMark className="c-scheme-plate__mark" />
          </span>
          <span className="c-scheme-plate__body">
            <span className="pica o-type-display kirk">From your garden</span>
            <span className="brevier c-scheme-plate__note">
              Build around the plants already in your garden.
            </span>
            <span className="c-scheme-plate__go o-type-label">
              Start
              <span aria-hidden="true" className="c-scheme-plate__arrow">
                →
              </span>
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => start("scratch")}
          className="c-scheme-plate is-new"
        >
          <span className="c-scheme-plate__field">
            <BarePlotMark className="c-scheme-plate__mark" />
          </span>
          <span className="c-scheme-plate__body">
            <span className="pica o-type-display kirk">From scratch</span>
            <span className="brevier c-scheme-plate__note">
              Start with plants you&apos;re considering — nothing needs to be in your
              garden yet.
            </span>
            <span className="c-scheme-plate__go o-type-label">
              Start
              <span aria-hidden="true" className="c-scheme-plate__arrow">
                →
              </span>
            </span>
          </span>
        </button>
      </div>

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
