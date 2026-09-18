"use client";

/**
 * The /plant-scheme entry's annotated example — the journey's three steps,
 * each shown with the real part it produces, so a gardener who has never
 * used the tool can see what they'll get before choosing a way in.
 *
 * Built from the workspace's own components and the journey's own mock data
 * (MOCK_QUESTIONS, MOCK_SUGGESTIONS, buildMatchNote), not bespoke artwork —
 * when those change, the example follows. It is labelled as an example and
 * is deliberately not interactive: a clickable fake would promise a live
 * demo that isn't there.
 *
 * The page's one authored moment: the border starts as dashed ghosts and
 * plants itself the first time the sheet is scrolled into view (the
 * elevation remounts with the plants, so its own staggered draw-in runs;
 * the month strip fills). Under prefers-reduced-motion the draw is already
 * off in _scheme-chat.scss, so it lands in its final state.
 *
 * Styles: `.c-scheme-example` in styles/components/_scheme-example.scss.
 */

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import BorderElevation from "./BorderElevation";
import FloweringYear from "./FloweringYear";
import { PlantCard } from "./PlantCard";
import { ChatMessage } from "./ChatLog";
import { buildMatchNote } from "./matchNote";
import { MOCK_QUESTIONS, MOCK_SUGGESTIONS } from "./mockData";
import type { QuestionOutcome, SchemePlant } from "./PlantSchemeContext";
import { Icon } from "@/components/ui/Icon";

const STARTING_PLANTS = ["Lavender", "Catmint"];

const ASPECT_QUESTION = MOCK_QUESTIONS[0];
const CHOSEN_ASPECT = "Full sun";

const EXAMPLE_OUTCOMES: QuestionOutcome[] = [
  { questionId: "aspect", type: "answered", answer: CHOSEN_ASPECT },
  { questionId: "soil", type: "answered", answer: "Free-draining" },
];

const EXAMPLE_PLANTS: SchemePlant[] = MOCK_SUGGESTIONS.map((s) => ({
  id: `example:${s.id}`,
  origin: "suggestion",
  sourceEntryId: null,
  plantId: s.id,
  commonName: s.commonName,
  latinName: s.latinName,
  tier: s.tier,
  note: s.note,
  badges: s.badges,
  months: s.months,
  photoUrl: null,
  addedToShoppingList: false,
}));

/** Two cards that genuinely suit the example's answers, so their "why this
 *  fits" line is real rather than decorative. */
const EXAMPLE_CARDS = MOCK_SUGGESTIONS.filter((s) => s.id === "s3" || s.id === "s6").map((s) => ({
  commonName: s.commonName,
  latinName: s.latinName,
  tier: s.tier,
  note: s.note,
  badges: s.badges,
  matchNote: buildMatchNote(s, EXAMPLE_OUTCOMES),
}));

export default function SchemeExample() {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [planted, setPlanted] = useState(false);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || typeof IntersectionObserver === "undefined") {
      setPlanted(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPlanted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(sheet);
    return () => observer.disconnect();
  }, []);

  const plants = planted ? EXAMPLE_PLANTS : [];

  return (
    <section className="c-scheme-example" aria-labelledby="scheme-example-title">
      <div className="c-scheme-example__head">
        <h2 id="scheme-example-title" className="o-type-label">
          Example scheme
        </h2>
        <span className="o-type-label c-scheme-example__meta">
          Sunny border, free-draining soil
        </span>
      </div>

      <ol className="c-scheme-example__steps">
        <li className="c-scheme-example__step">
          <div className="c-scheme-example__note">
            <span className="c-scheme-example__stamp" aria-hidden="true">
              1
            </span>
            <h3 className="long-primer o-type-display kirk">Start from plants</h3>
            <p className="brevier">
              Pick from the plants in your garden, or type the names of ones you&apos;re
              considering.
            </p>
          </div>
          <div className="c-scheme-example__art">
            <ul className="c-scheme-example__picked" aria-label="Starting plants in this example">
              {STARTING_PLANTS.map((name) => (
                <li key={name} className="c-scheme-example__pick brevier">
                  <Icon name="leaf" size={14} />
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </li>

        <li className="c-scheme-example__step">
          <div className="c-scheme-example__note">
            <span className="c-scheme-example__stamp" aria-hidden="true">
              2
            </span>
            <h3 className="long-primer o-type-display kirk">Answer what you know</h3>
            <p className="brevier">
              A few questions about the spot, such as which way it faces and the soil. Skip
              any you&apos;re not sure of.
            </p>
          </div>
          <div className="c-scheme-example__art c-scheme-example__ask">
            <ChatMessage role="assistant" showFrom>
              {ASPECT_QUESTION.prompt}
            </ChatMessage>
            <ul className="c-scheme-example__answers" aria-label="Answers offered">
              {ASPECT_QUESTION.suggestions?.map((answer) => {
                const chosen = answer === CHOSEN_ASPECT;
                return (
                  <li
                    key={answer}
                    className={clsx("c-scheme-example__answer brevier", chosen && "is-chosen")}
                  >
                    {chosen && <Icon name="check" size={12} />}
                    {answer}
                    {chosen && <span className="u-visually-hidden"> (chosen)</span>}
                  </li>
                );
              })}
              <li className="c-scheme-example__skip brevier">Skip</li>
            </ul>
          </div>
        </li>

        <li className="c-scheme-example__step">
          <div className="c-scheme-example__note">
            <span className="c-scheme-example__stamp" aria-hidden="true">
              3
            </span>
            <h3 className="long-primer o-type-display kirk">Shape it together</h3>
            <p className="brevier">
              Plotted suggests plants for the back, middle and front of the border, each with
              a reason. Add the ones you like. The border and its flowering months fill in as
              you go.
            </p>
          </div>
          <div ref={sheetRef} className="c-scheme-example__art c-scheme-example__sheet">
            {/* Until planted, the ghosts' census ("nothing at the back yet")
                would misdescribe the example — hide it from assistive tech. */}
            <div aria-hidden={!planted}>
              <BorderElevation key={planted ? "planted" : "ghost"} plants={plants} />
              <FloweringYear plants={plants} />
            </div>
            <div className="c-scheme-example__cards">
              {EXAMPLE_CARDS.map((card) => (
                <PlantCard key={card.commonName} plant={card} />
              ))}
            </div>
          </div>
        </li>
      </ol>
    </section>
  );
}
