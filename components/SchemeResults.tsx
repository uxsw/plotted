"use client";

/**
 * The finished planting scheme, set as a catalogue article: a season-washed
 * masthead with the border drawn in elevation, a short lead beside the facts
 * at a glance, the year in flower as a chart, the arrangement tier by tier,
 * the plants, the year's jobs, and a closing band that sends the gardener on
 * to the nursery.
 *
 * It is built to hold up with no photographs at all: the scheme's own data
 * (tiers, flowering months, flower colours) draws the figures, and a plant
 * without a picture is set differently rather than given an empty frame.
 * A scheme without a structured write-up (lib/scheme-article.ts) renders the
 * same page from its prose, with the sections that need the structure left out.
 *
 * Styles and the layout contract: styles/components/_scheme-article.scss.
 * A signed-out fixture lives at /design-check/scheme.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AiNoticePanel } from "@/components/ui/AiNoticePanel";
import { Icon } from "@/components/ui/Icon";
import { markSchemeAiNoticeSeen, markSuggestionPlanted } from "@/app/actions/schemes";
import type { Scheme, SchemeSuggestion, SchemeTier } from "@/lib/types";
import buttonStyles from "@/components/ui/Button.module.css";
import { TIER_VARIANTS, GROUND_Y } from "@/app/(app)/plant-scheme/_components/plantMarks";
import { GLANCE_KEYS, readStoredArticle, validFlowerColour, type GlanceKey } from "@/lib/scheme-article";
import {
  MONTH_NAMES,
  capitalise,
  describeMonthRuns,
  formatJobSpan,
  formatMonthRuns,
  heightRange,
  jobsBySeason,
  jobsInMonth,
  monthRuns,
  nextJob,
  numberWord,
  peakSeason,
  seasonBand,
} from "@/lib/scheme-view";

const TIER_ORDER: SchemeTier[] = ["back", "mid", "ground"];
const TIER_LABELS: Record<SchemeTier, string> = {
  back: "Back of the border",
  mid: "Middle of the border",
  ground: "Front edge",
};
const TIER_SHORT: Record<SchemeTier, string> = {
  back: "Back",
  mid: "Middle",
  ground: "Front edge",
};

const GLANCE_LABELS: Record<GlanceKey, string> = {
  aspect: "Aspect",
  soil: "Soil",
  at_its_best: "At its best",
  upkeep: "Upkeep",
};

const MONTH_LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const BADGE_CONFIG: {
  key: keyof Pick<SchemeSuggestion, "wildlife_value" | "drought_tolerant" | "edible" | "british_native">;
  label: string;
  modifier: string;
}[] = [
  { key: "wildlife_value", label: "Wildlife friendly", modifier: "is-wildlife-friendly" },
  { key: "drought_tolerant", label: "Drought tolerant", modifier: "is-drought-tolerant" },
  { key: "edible", label: "Edible", modifier: "is-edible" },
  { key: "british_native", label: "British native", modifier: "is-british-native" },
];

const ADD_FAILED = "Couldn't add it to your shopping list. Please try again.";

/** The class that colours a bar, dot or flower head: the plant's own colour, or its season's. */
function bloomClass(plant: SchemeSuggestion): string {
  const colour = validFlowerColour(plant.flower_colour);
  if (colour) return `is-bloom-${colour}`;
  const first = plant.flowering_months?.[0];
  return first ? `is-bloom-season-${seasonBand(first)}` : "is-bloom-none";
}

/* ---- The border in elevation ------------------------------------------ */

/**
 * Where each plant stands along the ground line. Every plant gets a place of
 * its own, dealt out tier by tier in turn (back, middle, front, back…), so the
 * skyline rises and falls along the border and no two silhouettes share a
 * spot. The marks themselves are the scheme journey's (plantMarks.ts).
 */
function borderPositions(plants: SchemeSuggestion[]): Map<string, { x: number; variant: number }> {
  const queues = TIER_ORDER.map((tier) => plants.filter((p) => p.tier === tier));
  const dealt: { plant: SchemeSuggestion; variant: number }[] = [];
  for (let round = 0; dealt.length < plants.length; round++) {
    for (const queue of queues) {
      if (queue[round]) dealt.push({ plant: queue[round], variant: round % 3 });
    }
  }
  const step = 244 / Math.max(dealt.length, 1);
  return new Map(
    dealt.map(({ plant, variant }, i) => [plant.id, { x: Math.round(18 + step * (i + 0.5)), variant }])
  );
}

/**
 * One silhouette per plant on a shared ground line, flower heads in the
 * plant's own colour. With `inGround`, a plant not yet in the garden is drawn
 * dashed, so the figure shows the border as it stands today.
 */
function SchemeBorder({
  plants,
  inGround,
  draws = false,
}: {
  plants: SchemeSuggestion[];
  inGround?: Set<string>;
  draws?: boolean;
}) {
  const positions = borderPositions(plants);
  return (
    <svg className="c-scheme-article__border-svg" viewBox="0 0 280 88" aria-hidden="true">
      <path className="c-scheme-article__ground" d={`M8 ${GROUND_Y} H272`} />
      {plants.map((plant, i) => {
        const { x, variant } = positions.get(plant.id)!;
        const { paths, dots } = TIER_VARIANTS[plant.tier][variant](x);
        const ghost = inGround ? !inGround.has(plant.id) : false;
        return (
          <g
            key={plant.id}
            className={["c-scheme-article__mark", bloomClass(plant), ghost ? "is-ghost" : "", draws ? "is-drawn" : ""]
              .filter(Boolean)
              .join(" ")}
            style={{ "--_delay": `${i * 0.07}s` } as React.CSSProperties}
          >
            {paths.map((d, j) => (
              <path key={j} d={d} pathLength={1} />
            ))}
            {!ghost && dots.map((dot, j) => <circle key={j} cx={dot.cx} cy={dot.cy} r={dot.r} />)}
          </g>
        );
      })}
    </svg>
  );
}

/** A single tier's mark, for the arrangement rows. */
function TierMark({ tier }: { tier: SchemeTier }) {
  const { paths, dots } = TIER_VARIANTS[tier][tier === "mid" ? 1 : 0](30);
  return (
    <svg className="c-scheme-article__tier-mark" viewBox="6 16 48 66" aria-hidden="true">
      <path className="c-scheme-article__ground" d={`M8 ${GROUND_Y} H52`} />
      <g className="c-scheme-article__mark">
        {paths.map((d, j) => (
          <path key={j} d={d} pathLength={1} />
        ))}
        {dots.map((dot, j) => (
          <circle key={j} cx={dot.cx} cy={dot.cy} r={dot.r} />
        ))}
      </g>
    </svg>
  );
}

/* ---- Title, renamed in place ------------------------------------------ */

function SchemeTitle({ schemeId, initialName }: { schemeId: string; initialName: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialName);
  const [saved, setSaved] = useState(initialName);
  const [failed, setFailed] = useState(false);
  const renameRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);

  // Hand focus back to the pencil when the field closes.
  useEffect(() => {
    if (wasEditing.current && !editing) renameRef.current?.focus();
    wasEditing.current = editing;
  }, [editing]);

  async function commit() {
    const trimmed = value.trim();
    setEditing(false);
    if (!trimmed || trimmed === saved) {
      setValue(saved);
      return;
    }
    const previous = saved;
    setValue(trimmed);
    setSaved(trimmed);
    setFailed(false);
    try {
      const res = await fetch(`/api/schemes/${schemeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setValue(previous);
      setSaved(previous);
      setFailed(true);
    }
  }

  return (
    <div className="c-scheme-article__title">
      {editing ? (
        <>
          <h1 className="u-visually-hidden">{saved}</h1>
          <input
            autoFocus
            aria-label="Scheme name"
            value={value}
            maxLength={80}
            onChange={(e) => setValue(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
              if (e.key === "Escape") {
                setValue(saved);
                setEditing(false);
              }
            }}
            className="c-scheme-article__title-field canon kirk o-type-display"
          />
        </>
      ) : (
        <>
          <h1 className="canon kirk o-type-display">{value}</h1>
          <button
            ref={renameRef}
            type="button"
            className="c-scheme-article__rename"
            onClick={() => setEditing(true)}
            aria-label="Rename this scheme"
          >
            <Icon name="pencil" size={16} />
          </button>
        </>
      )}
      {failed && (
        <p className="c-scheme-article__error brevier" role="alert">
          Couldn&rsquo;t save the new name. It&rsquo;s still &ldquo;{saved}&rdquo;.
        </p>
      )}
    </div>
  );
}

/* ---- The year in flower ----------------------------------------------- */

function BloomChart({ plants, nowMonth }: { plants: SchemeSuggestion[]; nowMonth: number }) {
  const charted = plants.filter((p) => (p.flowering_months?.length ?? 0) > 0);
  const uncharted = plants.filter((p) => (p.flowering_months?.length ?? 0) === 0);
  if (charted.length === 0) return null;

  return (
    <div className="c-scheme-article__bloom">
      <div className="c-scheme-article__bloom-head" aria-hidden="true">
        <span />
        <div className="c-scheme-article__bloom-months o-type-label">
          {MONTH_LETTERS.map((letter, i) => (
            <span key={i} className={i + 1 === nowMonth ? "is-now" : undefined}>
              {letter}
            </span>
          ))}
        </div>
      </div>
      <ul className="c-scheme-article__bloom-rows">
        {charted.map((plant) => (
          <li key={plant.id} className="c-scheme-article__bloom-row">
            <span className="c-scheme-article__bloom-name brevier">
              {plant.common_name}
              <span className="u-visually-hidden">
                {" "}
                flowers {describeMonthRuns(plant.flowering_months)}.
              </span>
            </span>
            <span className={`c-scheme-article__bloom-strip ${bloomClass(plant)}`} aria-hidden="true">
              <span className="c-scheme-article__bloom-now" style={{ gridColumn: nowMonth }} />
              {monthRuns(plant.flowering_months)
                .flatMap(([from, to]) => (to < from ? [[from, 12], [1, to]] : [[from, to]]))
                .map(([from, to]) => (
                  <span
                    key={from}
                    className="c-scheme-article__bloom-bar"
                    style={{ gridColumn: `${from} / ${to + 1}` }}
                  />
                ))}
            </span>
          </li>
        ))}
      </ul>
      {uncharted.length > 0 && (
        <p className="c-scheme-article__footnote minion">
          Not charted, as {uncharted.length === 1 ? "its" : "their"} flowering months aren&rsquo;t
          recorded: {uncharted.map((p) => p.common_name).join(", ")}.
        </p>
      )}
    </div>
  );
}

/* ---- One plant --------------------------------------------------------- */

type PlantState = "garden" | "list" | "wanted";

function PlantEntry({
  plant,
  state,
  plantId,
  busy,
  error,
  onAdd,
  onPlant,
}: {
  plant: SchemeSuggestion;
  state: PlantState;
  plantId: string | null;
  busy: "adding" | "planting" | null;
  error: string | null;
  onAdd: () => void;
  onPlant: () => void;
}) {
  const badges = BADGE_CONFIG.filter((b) => plant[b.key]);
  const months = formatMonthRuns(plant.flowering_months);
  const pictured = !!plant.wikimedia_image_url;
  const facts = [
    TIER_SHORT[plant.tier],
    plant.height_cm ? `${plant.height_cm}cm` : null,
    months ? `Flowers ${months}` : null,
  ].filter(Boolean);

  return (
    <li
      id={`plant-${plant.id}`}
      className={`c-scheme-article__plant ${pictured ? "is-pictured" : "is-unpictured"}`}
    >
      <div className="c-scheme-article__plant-head">
        <h3 className="c-scheme-article__plant-name pica kirk o-type-display">
          <span className={`c-scheme-article__dot ${bloomClass(plant)}`} aria-hidden="true" />
          {plant.common_name}
        </h3>
        <p className="c-scheme-article__latin brevier o-type-display o-type--italic">{plant.latin_name}</p>

        {plant.look && (
          <p className={`c-scheme-article__look o-type-display ${pictured ? "primer" : "long-primer"}`}>{plant.look}</p>
        )}
      </div>
      {pictured && (
        <div className="c-scheme-article__plate">
          <Image
            src={plant.wikimedia_image_url!}
            alt=""
            fill
            sizes="96px"
            className="c-scheme-article__plate-image"
          />
        </div>
      )}
      <div className="c-scheme-article__plant-body">
        <p className="c-scheme-article__role primer">{plant.why}</p>

        {plant.care && (
          <p className="c-scheme-article__care brevier">
            <span className="o-type-label">Care</span> {plant.care}
          </p>
        )}

        <p className="c-scheme-article__facts o-type-label">{facts.join(" · ")}</p>

        {badges.length > 0 && (
          <div className="c-scheme-article__badges">
            {badges.map((b) => (
              <span key={b.key} className={`o-badge is-sm ${b.modifier}`}>
                {b.label}
              </span>
            ))}
          </div>
        )}

        <div className="c-scheme-article__actions">
          {state === "garden" ? (
            <p className="c-scheme-article__status brevier">
              <Icon name="sprout" size={16} />
              In your garden
              {plantId && (
                <>
                  {" · "}
                  <Link href={`/plants/${plantId}`}>
                    View<span className="u-visually-hidden"> {plant.common_name}</span>
                  </Link>
                </>
              )}
            </p>
          ) : (
            <>
              {state === "list" ? (
                <p className="c-scheme-article__status brevier">
                  <Icon name="check" size={16} />
                  On your shopping list
                </p>
              ) : (
                <button
                  type="button"
                  className="c-scheme-article__action"
                  onClick={onAdd}
                  disabled={busy !== null}
                  aria-busy={busy === "adding"}
                >
                  <Icon name="add" size={16} />
                  {busy === "adding" ? "Adding…" : "Add to shopping list"}
                  <span className="u-visually-hidden">: {plant.common_name}</span>
                </button>
              )}
              <button
                type="button"
                className="c-scheme-article__action is-plant-out"
                onClick={onPlant}
                disabled={busy !== null}
                aria-busy={busy === "planting"}
              >
                <span className="c-scheme-article__ring" aria-hidden="true">
                  <Icon name="check" size={12} />
                </span>
                {busy === "planting" ? "Adding to your garden…" : "Mark as planted"}
                <span className="u-visually-hidden">: {plant.common_name}</span>
              </button>
            </>
          )}
        </div>

        {error && (
          <p className="c-scheme-article__error brevier" role="alert">
            {error}
          </p>
        )}

        {pictured && plant.wikimedia_attribution && (
          <a
            href={plant.wikimedia_attribution}
            target="_blank"
            rel="noopener noreferrer"
            className="c-scheme-article__credit minion"
          >
            Image: Wikimedia Commons
          </a>
        )}
      </div>
    </li>
  );
}

/* ---- The page ---------------------------------------------------------- */

export default function SchemeResults({
  scheme,
  suggestions,
  heroImage,
  onListLatin,
  gardenPlantIds,
}: {
  scheme: Scheme;
  suggestions: SchemeSuggestion[];
  heroImage: string | null;
  /** Latin names already on the shopping list for this scheme. */
  onListLatin: string[];
  /** Suggestion id → the gardener's own plant, for plants already in the garden. */
  gardenPlantIds: Record<string, string>;
}) {
  const [onList, setOnList] = useState(() => new Set(onListLatin));
  const [planted, setPlanted] = useState<Record<string, string>>(gardenPlantIds);
  const [busy, setBusy] = useState<Record<string, "adding" | "planting">>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  // The gardening year is the product's clock: the chart marks this month and
  // the jobs are read from it.
  const nowMonth = new Date().getMonth() + 1;

  const aiNoticeSeen = scheme.ai_notice_seen_at !== null;
  useEffect(() => {
    if (!aiNoticeSeen) markSchemeAiNoticeSeen(scheme.id);
  }, [scheme.id, aiNoticeSeen]);

  const article = useMemo(
    () => readStoredArticle(scheme.article, suggestions.map((s) => s.latin_name)),
    [scheme.article, suggestions]
  );
  const byLatin = useMemo(() => new Map(suggestions.map((s) => [s.latin_name, s])), [suggestions]);
  const season = useMemo(() => peakSeason(suggestions), [suggestions]);

  const stateOf = (p: SchemeSuggestion): PlantState =>
    planted[p.id] ? "garden" : onList.has(p.latin_name) ? "list" : "wanted";

  const inGarden = suggestions.filter((p) => stateOf(p) === "garden");
  const listed = suggestions.filter((p) => stateOf(p) === "list");
  const wanted = suggestions.filter((p) => stateOf(p) === "wanted");
  const inGround = new Set(inGarden.map((p) => p.id));

  async function addToList(plant: SchemeSuggestion): Promise<boolean> {
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemeId: scheme.id,
          species: plant.latin_name,
          commonNames: [plant.common_name],
          wikimediaImageUrl: plant.wikimedia_image_url,
          wikimediaAttribution: plant.wikimedia_attribution,
        }),
      });
      if (!res.ok) return false;
      setOnList((prev) => new Set(prev).add(plant.latin_name));
      return true;
    } catch {
      return false;
    }
  }

  function setEntryError(id: string, message: string | null) {
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[id] = message;
      else delete next[id];
      return next;
    });
  }

  function setEntryBusy(id: string, value: "adding" | "planting" | null) {
    setBusy((prev) => {
      const next = { ...prev };
      if (value) next[id] = value;
      else delete next[id];
      return next;
    });
  }

  async function handleAdd(plant: SchemeSuggestion) {
    setEntryError(plant.id, null);
    setEntryBusy(plant.id, "adding");
    const ok = await addToList(plant);
    setEntryBusy(plant.id, null);
    if (!ok) setEntryError(plant.id, ADD_FAILED);
  }

  async function handlePlant(plant: SchemeSuggestion) {
    setEntryError(plant.id, null);
    setEntryBusy(plant.id, "planting");
    let result: Awaited<ReturnType<typeof markSuggestionPlanted>>;
    try {
      result = await markSuggestionPlanted(scheme.id, plant.id);
    } catch {
      result = { error: "Couldn't add it to your garden. Please try again." };
    }
    setEntryBusy(plant.id, null);
    if ("error" in result) {
      setEntryError(plant.id, result.error);
      return;
    }
    const plantId = result.plantId;
    setPlanted((prev) => ({ ...prev, [plant.id]: plantId }));
  }

  async function handleAddAll() {
    const queue = wanted;
    setBulkError(null);
    const failed: string[] = [];
    for (let i = 0; i < queue.length; i++) {
      setBulk({ done: i, total: queue.length });
      if (!(await addToList(queue[i]))) failed.push(queue[i].common_name);
    }
    setBulk(null);
    if (failed.length > 0) {
      setBulkError(`Couldn't add ${failed.join(", ")}. Everything else is on your list.`);
    }
  }

  // Scheme-wide flowering, for the masthead line and the facts.
  const allMonths = suggestions.flatMap((p) => p.flowering_months ?? []);
  const inFlower = formatMonthRuns(allMonths);
  const heights = heightRange(suggestions);

  const glance: { label: string; value: string }[] = [
    ...GLANCE_KEYS.flatMap((key) =>
      article?.glance[key] ? [{ label: GLANCE_LABELS[key], value: article.glance[key]! }] : []
    ),
    ...(inFlower ? [{ label: "In flower", value: inFlower }] : []),
    ...(heights ? [{ label: "Heights", value: heights }] : []),
  ];

  const tiers = TIER_ORDER.map((tier) => ({
    tier,
    plants: suggestions.filter((s) => s.tier === tier),
    note: article?.arrangement[tier] ?? null,
  })).filter((t) => t.plants.length > 0);

  const proseParagraphs = article ? [] : (scheme.narrative_body ?? "").split(/\n{2,}/).filter(Boolean);

  const jobs = article?.jobs ?? [];
  const seasons = jobsBySeason(jobs, nowMonth);
  const dueNow = jobsInMonth(jobs, nowMonth);
  const upNext = dueNow.length === 0 ? nextJob(jobs, nowMonth) : null;

  const plantNames = (latin: string[]) =>
    latin.map((l) => byLatin.get(l)?.common_name).filter(Boolean).join(", ");

  const total = suggestions.length;
  const backHref = scheme.origin === "conversation" ? "/plant-scheme" : "/schemes";

  return (
    <article className={`c-scheme-article is-season-${season}`}>
      <Link href={backHref} className={[buttonStyles["o-button"], buttonStyles["o-button--ghost"], buttonStyles["o-button--flush-start"]].join(" ")}>
        <Icon name="back" size={16} />
        Planting schemes
      </Link>

      <header className={`c-scheme-article__masthead ${heroImage ? "has-photo" : ""}`}>
        <div className="c-scheme-article__masthead-text">
          {/* safe: app/(app)/schemes/[id]/page.tsx redirects non-complete schemes before this renders */}
          <SchemeTitle schemeId={scheme.id} initialName={scheme.name!} />
          {scheme.summary && (
            <p className="c-scheme-article__standfirst long-primer o-type-display o-type--italic">{scheme.summary}</p>
          )}
          <p className="c-scheme-article__meta o-type-label">
            {capitalise(numberWord(total))} {total === 1 ? "plant" : "plants"}
            {inFlower && ` · In flower ${inFlower}`}
          </p>
        </div>
        <div className="c-scheme-article__masthead-figure">
          {heroImage && (
            <div className="c-scheme-article__photo">
              <Image src={heroImage} alt="" fill sizes="(max-width: 700px) 60vw, 320px" priority />
            </div>
          )}
          <SchemeBorder plants={suggestions} draws />
        </div>
      </header>

      {!aiNoticeSeen && (
        <AiNoticePanel>
          This scheme was written by AI. It&rsquo;s worth a check on plant pairings and timing before relying on it.
        </AiNoticePanel>
      )}

      <div className="c-scheme-article__lead">
        <div className="c-scheme-article__lead-text">
          <p className="c-scheme-article__intro long-primer o-type-display">{scheme.narrative_intro}</p>
          {proseParagraphs.map((para, i) => (
            <p key={i} className="primer">
              {para}
            </p>
          ))}
          {article?.key_idea && (
            <p className="c-scheme-article__key-idea long-pica o-type-display">{article.key_idea}</p>
          )}
        </div>
        {glance.length > 0 && (
          <dl className="c-scheme-article__glance">
            {glance.map(({ label, value }) => (
              <div key={label}>
                <dt className="o-type-label">{label}</dt>
                <dd className="primer">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {allMonths.length > 0 && (
        <section className="c-scheme-article__section" aria-labelledby="scheme-flower">
          <div className="c-scheme-article__rail">
            <h2 id="scheme-flower" className="paragon kirk o-type-display">The year in flower</h2>
            <p className="brevier">Each bar is one plant, drawn in its own colour across the months it flowers.</p>
          </div>
          <BloomChart plants={suggestions} nowMonth={nowMonth} />
        </section>
      )}

      <section className="c-scheme-article__section" aria-labelledby="scheme-arrange">
        <div className="c-scheme-article__rail">
          <h2 id="scheme-arrange" className="paragon kirk o-type-display">How to arrange it</h2>
          <p className="brevier">From the back of the border to its front edge.</p>
        </div>
        <div className="c-scheme-article__arrange">
          <ol className="c-scheme-article__tiers">
            {tiers.map(({ tier, plants, note }) => (
              <li key={tier} className="c-scheme-article__tier">
                <TierMark tier={tier} />
                <div>
                  <h3 className="long-primer kirk o-type-display">{TIER_LABELS[tier]}</h3>
                  {note && <p className="primer">{note}</p>}
                  <p className="c-scheme-article__tier-plants brevier">
                    {plants.map((p, i) => (
                      <span key={p.id}>
                        {i > 0 && ", "}
                        <a href={`#plant-${p.id}`}>{p.common_name}</a>
                      </span>
                    ))}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {article && article.pairings.length > 0 && (
            <div className="c-scheme-article__pairings">
              <h3 className="long-primer kirk o-type-display">Pairings worth making</h3>
              <ul>
                {article.pairings.map((pairing) => {
                  const a = byLatin.get(pairing.a)!;
                  const b = byLatin.get(pairing.b)!;
                  return (
                    <li key={`${pairing.a}|${pairing.b}`} className="c-scheme-article__pairing">
                      <p className="c-scheme-article__pair long-primer o-type-display">
                        <span>
                          <span className={`c-scheme-article__dot ${bloomClass(a)}`} aria-hidden="true" />
                          {a.common_name}
                        </span>
                        <span className="c-scheme-article__pair-with brevier">with</span>
                        <span>
                          <span className={`c-scheme-article__dot ${bloomClass(b)}`} aria-hidden="true" />
                          {b.common_name}
                        </span>
                      </p>
                      <p className="brevier">{pairing.why}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="c-scheme-article__section" aria-labelledby="scheme-plants">
        <div className="c-scheme-article__rail">
          <h2 id="scheme-plants" className="paragon kirk o-type-display">The plants</h2>
          <p className="brevier">
            {capitalise(numberWord(total))} in all
            {inGarden.length > 0 &&
              `, ${numberWord(inGarden.length)} already in your garden`}
            .
          </p>
        </div>
        <ul className="c-scheme-article__plants">
          {TIER_ORDER.flatMap((tier) => suggestions.filter((s) => s.tier === tier)).map((plant) => (
            <PlantEntry
              key={plant.id}
              plant={plant}
              state={stateOf(plant)}
              plantId={planted[plant.id] ?? null}
              busy={busy[plant.id] ?? (bulk && stateOf(plant) === "wanted" ? "adding" : null)}
              error={errors[plant.id] ?? null}
              onAdd={() => handleAdd(plant)}
              onPlant={() => handlePlant(plant)}
            />
          ))}
        </ul>
      </section>

      {jobs.length > 0 && (
        <section className="c-scheme-article__section" aria-labelledby="scheme-year">
          <div className="c-scheme-article__rail">
            <h2 id="scheme-year" className="paragon kirk o-type-display">Month by month</h2>
            <p className="brevier">The jobs that keep this border going, read from today.</p>
          </div>
          <div className="c-scheme-article__year">
            <div className="c-scheme-article__now">
              <h3 className="long-primer kirk o-type-display">{MONTH_NAMES[nowMonth - 1]} in this border</h3>
              {dueNow.length > 0 ? (
                <ul>
                  {dueNow.map((job) => (
                    <li key={job.title}>
                      <p className="primer o-type-weight--medium">{job.title}</p>
                      <p className="brevier">{job.detail}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="primer">
                  Nothing needs doing this month.
                  {upNext && (
                    <>
                      {" "}
                      Next, in {MONTH_NAMES[upNext.from - 1]}: {upNext.title.charAt(0).toLowerCase() + upNext.title.slice(1)}.
                    </>
                  )}
                </p>
              )}
            </div>

            <ol className="c-scheme-article__seasons">
              {seasons.map(({ season: name, label, span, jobs: seasonJobs }) => (
                <li key={name} className={`c-scheme-article__season is-${name}`}>
                  <h3 className="c-scheme-article__season-head">
                    <span className="long-primer kirk o-type-display">{label}</span>
                    <span className="o-type-label">{span}</span>
                  </h3>
                  {seasonJobs.length === 0 ? (
                    <p className="c-scheme-article__quiet brevier">A quiet season. Nothing to do.</p>
                  ) : (
                    <ul>
                      {seasonJobs.map((job) => (
                        <li key={job.title} className="c-scheme-article__job">
                          <p className="c-scheme-article__job-when o-type-label">{formatJobSpan(job)}</p>
                          <p className="primer o-type-weight--medium">{job.title}</p>
                          <p className="brevier">{job.detail}</p>
                          {job.plants.length > 0 && (
                            <p className="c-scheme-article__job-plants minion">{plantNames(job.plants)}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="c-scheme-article__next" aria-labelledby="scheme-next">
        <div className="c-scheme-article__next-text">
          {wanted.length > 0 ? (
            <>
              <h2 id="scheme-next" className="paragon kirk o-type-display">Take it to the nursery</h2>
              <p className="primer">
                {capitalise(numberWord(wanted.length))} {wanted.length === 1 ? "plant" : "plants"} still to
                find: {wanted.map((p) => p.common_name).join(", ")}.
                {listed.length > 0 &&
                  ` ${capitalise(numberWord(listed.length))} ${listed.length === 1 ? "is" : "are"} already on your shopping list.`}
              </p>
            </>
          ) : listed.length > 0 ? (
            <>
              <h2 id="scheme-next" className="paragon kirk o-type-display">Take it to the nursery</h2>
              <p className="primer">
                Everything you still need is on your shopping list: {listed.map((p) => p.common_name).join(", ")}.
                Tick each one off here as it goes in the ground.
              </p>
            </>
          ) : (
            <>
              <h2 id="scheme-next" className="paragon kirk o-type-display">It&rsquo;s all in the ground</h2>
              <p className="primer">
                Every plant in this scheme is in your garden. The jobs above will keep it going through the year.
              </p>
            </>
          )}

          <div className="c-scheme-article__next-actions">
            {wanted.length > 0 && (
              <button
                type="button"
                className={[buttonStyles["o-button"], buttonStyles["o-button--primary"]].join(" ")}
                onClick={handleAddAll}
                disabled={bulk !== null}
                aria-busy={bulk !== null}
              >
                {bulk
                  ? `Adding ${bulk.done + 1} of ${bulk.total}…`
                  : wanted.length === 1
                    ? "Add it to your shopping list"
                    : `Add all ${numberWord(wanted.length)} to your shopping list`}
              </button>
            )}
            {(listed.length > 0 || wanted.length === 0) && (
              <Link
                href={listed.length > 0 ? "/shopping-list" : "/plants"}
                className={[
                  buttonStyles["o-button"],
                  buttonStyles[wanted.length > 0 ? "o-button--secondary" : "o-button--primary"],
                ].join(" ")}
              >
                {listed.length > 0 ? "Open shopping list" : "Open your garden"}
              </Link>
            )}
            <Link
              href="/plant-scheme"
              className={[buttonStyles["o-button"], buttonStyles["o-button--ghost"]].join(" ")}
            >
              Plan another border
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>

          {bulkError && (
            <p className="c-scheme-article__error brevier" role="alert">
              {bulkError}
            </p>
          )}
        </div>

        <figure className="c-scheme-article__so-far">
          <SchemeBorder plants={suggestions} inGround={inGround} />
          <figcaption className="brevier">
            The border so far: {numberWord(inGarden.length)} of {numberWord(total)} in the ground.
            {inGarden.length < total && " Dashed plants are still to go in."}
          </figcaption>
        </figure>
      </section>
    </article>
  );
}
