/**
 * The structured half of a planting scheme's write-up: short, typed pieces
 * the scheme page can set as figures, lists and pull lines instead of long
 * paragraphs. Stored as `schemes.article` (jsonb). A scheme without one (the
 * /schemes/new form journey, and anything saved before this existed) still
 * renders, from `narrative_intro` / `narrative_body`.
 *
 * Pure (no SDK, no I/O): `parseSchemeArticle` reads both the model's reply
 * and the stored column, and drops anything malformed rather than repairing
 * it. Plants are referred to by Latin name, which is how the page matches
 * them back to `scheme_suggestions` rows.
 */

import type { SchemeTier } from "@/lib/types";

/** The flower (or, for foliage plants, the leaf) colour the page draws with. */
export const FLOWER_COLOURS = [
  "white",
  "cream",
  "yellow",
  "orange",
  "red",
  "pink",
  "purple",
  "blue",
  "green",
  "bronze",
] as const;
export type FlowerColour = (typeof FLOWER_COLOURS)[number];

export function validFlowerColour(value: unknown): FlowerColour | null {
  return typeof value === "string" && (FLOWER_COLOURS as readonly string[]).includes(value)
    ? (value as FlowerColour)
    : null;
}

/** The fixed "at a glance" facts, in display order. */
export const GLANCE_KEYS = ["aspect", "soil", "at_its_best", "upkeep"] as const;
export type GlanceKey = (typeof GLANCE_KEYS)[number];

export type SchemePairing = { a: string; b: string; why: string };

export type SchemeJob = {
  /** Months 1–12; `to` may be earlier than `from` for a job that runs over winter. */
  from: number;
  to: number;
  title: string;
  detail: string;
  /** Latin names of the plants the job concerns; empty means the whole border. */
  plants: string[];
};

export type SchemeArticle = {
  /** One sentence: the idea the arrangement rests on. Set large on the page. */
  key_idea: string | null;
  glance: Partial<Record<GlanceKey, string>>;
  arrangement: Partial<Record<SchemeTier, string>>;
  pairings: SchemePairing[];
  jobs: SchemeJob[];
};

const TIERS: SchemeTier[] = ["back", "mid", "ground"];
const MAX_PAIRINGS = 3;
const MAX_JOBS = 8;

function text(value: unknown, maxChars: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxChars) : null;
}

function month(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

/**
 * `resolvePlant` turns whatever the source used to name a plant into a Latin
 * name from the scheme, or null. The model's reply refers to plants by their
 * number in the prompt; the stored column already holds Latin names.
 */
export function parseSchemeArticle(
  raw: unknown,
  resolvePlant: (ref: unknown) => string | null
): SchemeArticle | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const glance: SchemeArticle["glance"] = {};
  if (typeof r.glance === "object" && r.glance !== null) {
    const g = r.glance as Record<string, unknown>;
    for (const key of GLANCE_KEYS) {
      const value = text(g[key], 80);
      if (value) glance[key] = value;
    }
  }

  const arrangement: SchemeArticle["arrangement"] = {};
  if (typeof r.arrangement === "object" && r.arrangement !== null) {
    const a = r.arrangement as Record<string, unknown>;
    for (const tier of TIERS) {
      const value = text(a[tier], 400);
      if (value) arrangement[tier] = value;
    }
  }

  const pairings: SchemePairing[] = [];
  if (Array.isArray(r.pairings)) {
    for (const entry of r.pairings) {
      if (typeof entry !== "object" || entry === null) continue;
      const e = entry as Record<string, unknown>;
      const a = resolvePlant(e.a);
      const b = resolvePlant(e.b);
      const why = text(e.why, 300);
      if (!a || !b || a === b || !why) continue;
      pairings.push({ a, b, why });
      if (pairings.length === MAX_PAIRINGS) break;
    }
  }

  const jobs: SchemeJob[] = [];
  if (Array.isArray(r.jobs)) {
    for (const entry of r.jobs) {
      if (typeof entry !== "object" || entry === null) continue;
      const e = entry as Record<string, unknown>;
      const from = month(e.from);
      const title = text(e.title, 80);
      const detail = text(e.detail, 300);
      if (!from || !title || !detail) continue;
      const plants = Array.isArray(e.plants)
        ? Array.from(new Set(e.plants.map(resolvePlant).filter((p): p is string => p !== null)))
        : [];
      jobs.push({ from, to: month(e.to) ?? from, title, detail, plants });
      if (jobs.length === MAX_JOBS) break;
    }
  }

  const article: SchemeArticle = {
    key_idea: text(r.key_idea, 240),
    glance,
    arrangement,
    pairings,
    jobs,
  };

  // An article with nothing usable in it is no article: the page falls back to prose.
  const empty =
    !article.key_idea &&
    Object.keys(glance).length === 0 &&
    Object.keys(arrangement).length === 0 &&
    pairings.length === 0 &&
    jobs.length === 0;
  return empty ? null : article;
}

/** Reads the stored `schemes.article` column for a scheme with these plants. */
export function readStoredArticle(value: unknown, latinNames: string[]): SchemeArticle | null {
  const known = new Set(latinNames);
  return parseSchemeArticle(value, (ref) => (typeof ref === "string" && known.has(ref) ? ref : null));
}

/** The months a job covers, in order, handling a run over the new year. */
export function jobMonths(job: Pick<SchemeJob, "from" | "to">): number[] {
  const months: number[] = [];
  let m = job.from;
  for (let i = 0; i < 12; i++) {
    months.push(m);
    if (m === job.to) break;
    m = m === 12 ? 1 : m + 1;
  }
  return months;
}
