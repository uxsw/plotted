"use client";

/**
 * The open half of "Plan a new scheme" — search-or-type, then a wide gallery
 * of the gardener's own plants to browse and multi-select from. Split out of
 * StartPanel.tsx's compact tray card on purpose: the tray is a decisive,
 * bounded moment ("here's what I've got, go"); this is a leisurely, visual
 * browse of a whole garden, so it earns to breathe wider than the page's own
 * measure rather than being boxed alongside the tray.
 *
 * Replaces the old cramped `minmax(5.5rem, 1fr)` tile grid (thumbnails read
 * as an afterthought, the selection mark as a checkbox bolted onto a photo)
 * with the app's own `.o-card` grammar at real size — the same photo-card
 * DNA as the /plants catalogue, so picking plants for a scheme feels like an
 * extension of the portfolio rather than a bureaucratic form. Selection
 * follows the established Radio card grammar (DESIGN.md Components): a mark
 * drawn in both states plus a ring around the card, never a fill — a photo
 * card can't be filled without burying the photograph.
 *
 * The grid alone breaks out past the page's product measure (the search
 * field and heading stay at it) — a deliberate asymmetry, the same "page
 * opens up" device the hub used for its retired first-run teaser, now spent
 * on real substance instead of a marketing moment. No horizontal scroll at
 * any width and no internal scroll cap: a wrapping grid the page scrolls
 * past handles a large garden far better than either the old start panel's
 * boxed-and-capped grid or /schemes/new's horizontal deck ever did.
 *
 * Styles: `.c-garden-gallery` in styles/components/_scheme-hub.scss.
 */

import type { RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { plantDisplayTitle } from "@/lib/plantName";
import { Icon } from "@/components/ui/Icon";
import type { PickerPlant } from "./StartPanel";

function latinName(p: PickerPlant): string {
  const binomial = [p.genus, p.species].filter(Boolean).join(" ").trim();
  return p.cultivar ? `${binomial} '${p.cultivar}'`.trim() : binomial;
}

export default function GardenGallery({
  plants,
  garden,
  matches,
  query,
  setQuery,
  inputRef,
  full,
  trimmed,
  addLabel,
  onSubmitField,
  isPicked,
  onToggle,
  ids,
}: {
  /** Raw prop from the hub — null distinguishes a failed read from a garden
   *  that's genuinely empty. */
  plants: PickerPlant[] | null;
  garden: PickerPlant[];
  matches: PickerPlant[];
  query: string;
  setQuery: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  full: boolean;
  trimmed: string;
  addLabel: string | null;
  onSubmitField: () => void;
  isPicked: (plant: PickerPlant) => boolean;
  onToggle: (plant: PickerPlant) => void;
  ids: { field: string; fieldNote: string; garden: string };
}) {
  const needle = trimmed.toLowerCase();

  return (
    <div className="c-garden-gallery">
      <form
        className="c-garden-gallery__find"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitField();
        }}
      >
        <label htmlFor={ids.field} className="o-type-label">
          Add a plant
        </label>
        <div className="c-garden-gallery__field-wrap">
          <Icon name="search" size={16} className="c-garden-gallery__field-icon" />
          <input
            ref={inputRef}
            id={ids.field}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
            }}
            disabled={full}
            placeholder={
              garden.length > 0 ? "Search your garden or type any plant" : "Type any plant, e.g. Salvia"
            }
            autoComplete="off"
            aria-describedby={full ? ids.fieldNote : undefined}
            /* A stable hook for SchemeWelcomeDialog to hand off to on
               finish — `ids.field` is a per-instance useId(), not
               something a sibling component tree could target. */
            data-onboarding-target="add-plant-field"
            className="c-garden-gallery__field primer"
          />
        </div>
        {full ? (
          <p id={ids.fieldNote} className="minion c-garden-gallery__note">
            That&apos;s five, plenty to start from. Remove one to swap it for another.
          </p>
        ) : trimmed && addLabel ? (
          <button type="submit" className="c-garden-gallery__add brevier">
            <Icon name="add" size={14} />
            {addLabel}
          </button>
        ) : (
          garden.length === 0 && (
            <p className="minion c-garden-gallery__note">
              {plants === null ? (
                "Couldn't load your garden plants just now — you can still type a name above."
              ) : (
                <>
                  No plants in your garden yet —{" "}
                  <Link href="/plants/new">add one</Link>, or just type a name above.
                </>
              )}
            </p>
          )
        )}
      </form>

      {garden.length > 0 && (
        <div className="c-garden-gallery__section">
          <div className="c-scheme-start__row">
            <span id={ids.garden} className="o-type-label">
              In your garden
            </span>
            <span className="o-type-label c-scheme-start__count">
              {needle ? `${matches.length} of ${garden.length}` : garden.length}
            </span>
          </div>

          {matches.length === 0 ? (
            <p className="brevier c-garden-gallery__empty">
              None of your plants match &ldquo;{trimmed}&rdquo;.
            </p>
          ) : (
            <ul className="c-garden-gallery__grid" aria-labelledby={ids.garden}>
              {matches.map((plant) => {
                const picked = isPicked(plant);
                const common = plantDisplayTitle(plant);
                const latin = latinName(plant);
                /* plantDisplayTitle already falls back to the binomial when
                   there's no common name — only show the Latin caption
                   underneath when it would say something the title doesn't. */
                const showLatin = latin && common !== latin;
                return (
                  <li key={plant.id}>
                    <button
                      type="button"
                      onClick={() => onToggle(plant)}
                      aria-pressed={picked}
                      disabled={!picked && full}
                      className={`o-card o-card--interactive c-garden-gallery__tile${picked ? " is-selected" : ""}`}
                    >
                      <div className="o-card__media">
                        {plant.photo_url ? (
                          <Image
                            src={plant.photo_url}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 160px"
                            className="is-image"
                          />
                        ) : (
                          <div className="is-placeholder">
                            <Icon name="sprout" size={28} />
                          </div>
                        )}
                        <span className="c-garden-gallery__mark" aria-hidden="true">
                          <Icon name="check" size={11} />
                        </span>
                      </div>
                      <div className="o-card__body">
                        <span className="brevier c-garden-gallery__name">{common}</span>
                        {showLatin && (
                          <span className="minion o-type--italic c-garden-gallery__latin">
                            {latin}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
