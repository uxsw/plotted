"use client";

/* ──────────────────────────────────────────────────────────────────────────
   PLANT-SCHEME ENTRY — "The Annotated Specimen"        direction: shaped

   THESIS  The front door has to explain a tool nobody has used yet, so the
   explanation and the proof are one object: a clearly labelled example
   scheme, annotated with the journey's own three steps and drawn with the
   workspace's real parts (border elevation, flowering year, suggestion
   cards with their "why this fits" line). What you read is what you'll get.
   It replaces a text-over-photograph hero that carried the essential copy
   on a scrim.

   SEQUENCE  Promise (title, one-sentence lead, a jump to the choice for
   returning gardeners) beside a matted image plate captioned below — the
   photograph supports, it no longer carries text → the annotated example
   → "Choose how to start": the two season-washed doors, the garden door
   showing the gardener's own plant count and photos.

   AUTHORED MOMENT  The example border plants itself the first time it is
   seen: dashed ghosts give way to silhouettes drawing in, and the months
   fill. Door hovers are incidental. Reduced motion: final state, instantly.

   HONESTY  The whole journey is still mocked, so copy promises only what
   the shipped flow does — skippable questions, reasons on suggestions,
   explicit add/remove. No garden-profile "we'll remember" claim until that
   exists. Hero raster: garden-hero-2.jpg, team-supplied.
   ────────────────────────────────────────────────────────────────────── */

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { usePlantScheme } from "./PlantSchemeContext";
import SchemeExample from "./SchemeExample";
import { Icon } from "@/components/ui/Icon";
import buttonStyles from "@/components/ui/Button.module.css";

export interface GardenSummary {
  /** Active plants in the garden. */
  count: number;
  /** Most recent stored plant photos, newest first (already capped). */
  photos: string[];
}

const THUMB_SLOTS = 4;

function gardenNote(garden: GardenSummary | null): string {
  if (garden === null) return "Build around the plants already in your garden.";
  if (garden.count === 1) return "Build around the plant already in your garden.";
  return `Build around the ${garden.count} plants already in your garden.`;
}

/** Overlapping roundels of the gardener's own plants — photo where one is
 *  stored, a sprout where not — then "+N" for the rest. Decorative: the count
 *  is carried in text by the plate's note. */
function GardenThumbs({ garden }: { garden: GardenSummary }) {
  const shown = Math.min(garden.count, THUMB_SLOTS);
  const extra = garden.count - shown;

  return (
    <span className="c-scheme-plate__garden" aria-hidden="true">
      {Array.from({ length: shown }, (_, i) => {
        const src = garden.photos[i];
        return (
          <span key={i} className="c-scheme-plate__thumb">
            {src ? <Image src={src} alt="" fill sizes="48px" /> : <Icon name="sprout" size={18} />}
          </span>
        );
      })}
      {extra > 0 && <span className="c-scheme-plate__thumb is-more o-type-label">+{extra}</span>}
    </span>
  );
}

export default function EntryChoice({ garden }: { garden: GardenSummary | null }) {
  const router = useRouter();
  const { choosePath, reset } = usePlantScheme();

  function start(path: "existing" | "scratch") {
    reset();
    choosePath(path);
    router.push(`/plant-scheme/${path}`);
  }

  const gardenIsEmpty = garden !== null && garden.count === 0;

  return (
    <div className="c-scheme-entry">
      <header className="c-scheme-entry__head">
        <div className="c-scheme-entry__intro">
          <h1 className="canon o-type-display kirk c-scheme-entry__title">
            Plan a planting scheme
          </h1>
          <p className="primer c-scheme-entry__lead">
            Start from a few plants, tell Plotted about the spot, and build up a border
            together. Every plant it suggests comes with a reason, and nothing joins your
            scheme unless you add it.
          </p>
          <a
            href="#scheme-start"
            className={clsx(
              buttonStyles["o-button"],
              buttonStyles["o-button--ghost"],
              buttonStyles["o-button--flush-start"]
            )}
          >
            Choose how to start
            <Icon name="arrowDown" size={16} />
          </a>
        </div>

        <figure className="c-scheme-entry__photo">
          <div className="c-scheme-entry__mat">
            <div className="c-scheme-entry__frame">
              <Image
                src="/garden-hero-2.jpg"
                alt="An evening view down a stone path through a full cottage-garden border, hills beyond"
                fill
                priority
                quality={70}
                sizes="(max-width: 40rem) 100vw, 15rem"
                className="c-scheme-entry__img"
              />
            </div>
          </div>
          <figcaption className="c-scheme-entry__caption brevier">
            <span className="o-type--italic">A cottage border at midsummer</span>
            <span className="o-type-label" aria-hidden="true">
              001
            </span>
          </figcaption>
        </figure>
      </header>

      <SchemeExample />

      <section
        id="scheme-start"
        className="c-scheme-entry__start"
        aria-labelledby="scheme-start-title"
      >
        <h2 id="scheme-start-title" className="pica o-type-display kirk">
          Choose how to start
        </h2>

        <div className="c-scheme-entry__plates">
          {gardenIsEmpty ? (
            <div className="c-scheme-plate is-unavailable">
              <span className="c-scheme-plate__field">
                <Icon name="leafygreen" className="c-scheme-plate__mark" />
              </span>
              <span className="c-scheme-plate__body">
                <h3 className="pica o-type-display kirk">From your garden</h3>
                <p className="brevier c-scheme-plate__note">
                  There are no plants in your garden yet. Add one, and you can build a
                  scheme around it.
                </p>
                <Link href="/plants/new" className="c-scheme-plate__go o-type-label">
                  Add a plant
                  <Icon name="arrowRight" size={14} className="c-scheme-plate__arrow" />
                </Link>
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => start("existing")}
              className="c-scheme-plate is-established"
            >
              <span className="c-scheme-plate__field">
                <Icon name="leafygreen" className="c-scheme-plate__mark" />
                {garden && <GardenThumbs garden={garden} />}
              </span>
              <span className="c-scheme-plate__body">
                <span className="pica o-type-display kirk">From your garden</span>
                <span className="brevier c-scheme-plate__note">{gardenNote(garden)}</span>
                <span className="c-scheme-plate__go o-type-label">
                  Start
                  <Icon name="arrowRight" size={14} className="c-scheme-plate__arrow" />
                </span>
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => start("scratch")}
            className="c-scheme-plate is-new"
          >
            <span className="c-scheme-plate__field">
              <Icon name="sprout" className="c-scheme-plate__mark" />
            </span>
            <span className="c-scheme-plate__body">
              <span className="pica o-type-display kirk">From scratch</span>
              <span className="brevier c-scheme-plate__note">
                Start with plants you&apos;re considering. Nothing needs to be in your garden
                yet.
              </span>
              <span className="c-scheme-plate__go o-type-label">
                Start
                <Icon name="arrowRight" size={14} className="c-scheme-plate__arrow" />
              </span>
            </span>
          </button>
        </div>
      </section>

      <Link
        href="/schemes"
        className={clsx(
          buttonStyles["o-button"],
          buttonStyles["o-button--ghost"],
          buttonStyles["o-button--flush-start"]
        )}
      >
        <Icon name="back" size={16} />
        Back to planting schemes
      </Link>
    </div>
  );
}
