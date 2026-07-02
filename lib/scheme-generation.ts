import Anthropic from "@anthropic-ai/sdk";
import { validMonth } from "@/lib/plant-lookup";
import type { SchemeSpace, SchemeTier } from "@/lib/types";

const anthropic = new Anthropic();

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SPACE_LABEL: Record<SchemeSpace, string> = {
  small: "small (up to 2m²)",
  medium: "medium (2–6m²)",
  large: "large (6m²+)",
};

const SUGGESTION_COUNT: Record<SchemeSpace, string> = {
  small: "4–5",
  medium: "5–7",
  large: "6–8",
};

export type SourcePlantInput = {
  genus: string;
  species: string | null;
  cultivar: string | null;
  common_names: string[];
  sun_needs: string | null;
  flowering_season_from: number | null;
  flowering_season_to: number | null;
  eventual_height_cm: number | null;
};

export type SchemePreferences = {
  space: SchemeSpace;
  successional: boolean;
  edible: boolean;
};

export type ParsedSuggestion = {
  common_name: string;
  latin_name: string;
  tier: SchemeTier;
  height_cm: number | null;
  flowering_months: number[] | null;
  why: string;
  wildlife_value: boolean;
  drought_tolerant: boolean;
  edible: boolean;
  british_native: boolean;
};

export type SchemeGenerationResult = {
  narrative_intro: string;
  narrative_body: string;
  featured_plant_latin: string | null;
  suggestions: ParsedSuggestion[];
};

/** Expands a from/to month range into the individual months it covers, handling year wraparound (e.g. Nov–Feb). */
function monthsInRange(from: number, to: number): number[] {
  const months: number[] = [];
  let m = from;
  for (let i = 0; i < 12; i++) {
    months.push(m);
    if (m === to) break;
    m = m === 12 ? 1 : m + 1;
  }
  return months;
}

function formatPlantLine(plant: SourcePlantInput): string {
  const name = [plant.genus, plant.species, plant.cultivar].filter(Boolean).join(" ");
  const commonName = plant.common_names[0];
  const parts = [commonName ? `${name} (${commonName})` : name];
  if (plant.sun_needs) parts.push(`sun: ${plant.sun_needs}`);
  if (plant.eventual_height_cm) parts.push(`height: ${plant.eventual_height_cm}cm`);
  if (plant.flowering_season_from && plant.flowering_season_to) {
    parts.push(
      `flowering: ${MONTH_NAMES[plant.flowering_season_from - 1]}–${MONTH_NAMES[plant.flowering_season_to - 1]}`
    );
  }
  return `- ${parts.join(", ")}`;
}

export function buildSchemePrompt(plants: SourcePlantInput[], prefs: SchemePreferences): string {
  const heights = plants.map((p) => p.eventual_height_cm).filter((h): h is number => h != null);
  const avgHeight = heights.length ? Math.round(heights.reduce((a, b) => a + b, 0) / heights.length) : null;

  const sunNeeds = Array.from(new Set(plants.map((p) => p.sun_needs).filter((s): s is string => !!s)));

  const coveredSet = new Set<number>();
  for (const p of plants) {
    if (p.flowering_season_from && p.flowering_season_to) {
      for (const m of monthsInRange(p.flowering_season_from, p.flowering_season_to)) coveredSet.add(m);
    }
  }
  const coveredMonths = Array.from(coveredSet).sort((a, b) => a - b);
  const gapMonths = Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => !coveredSet.has(m));

  const edibleInstruction = prefs.edible
    ? "\n- prioritise edible or dual-purpose plants (fruit, vegetables, herbs)"
    : "";

  return `You are an expert horticultural adviser writing personalised planting recommendations for a gardening app called Plotted. Your tone is warm, authoritative and educational — like a knowledgeable garden columnist writing for an informed but non-expert audience. Avoid jargon. Never use the word "tapestry". Prefer the most common, friendly version of a plant's common name.

The user has selected these plants from their garden:
${plants.map(formatPlantLine).join("\n")}

Context inferred from their selection:
- Average height: ${avgHeight != null ? `~${avgHeight}cm` : "unknown"}
- Light conditions: ${sunNeeds.length ? sunNeeds.join(", ") : "unknown"}
- Current flowering coverage: ${coveredMonths.length ? coveredMonths.map((m) => MONTH_NAMES[m - 1]).join(", ") : "none known"}
- Flowering gaps: ${gapMonths.map((m) => MONTH_NAMES[m - 1]).join(", ")}
- Available space: ${SPACE_LABEL[prefs.space]}
- Successional planting: ${prefs.successional ? "yes" : "no"}

Preferences:
- weight suggestions toward plants with strong wildlife and pollinator value
- weight suggestions toward drought-tolerant plants where possible${edibleInstruction}

Return a JSON object with exactly this structure:
{
  "narrative_intro": "A single opening paragraph. Characterise the existing planting warmly and identify the main opportunity or challenge the suggestions will address. This paragraph appears before the first image in the app, so it should work as a compelling standalone hook.",
  "narrative_body": "Two paragraphs. Explain the strategy behind the suggestions and what the additions achieve together. Where natural, reference one of the suggested plants by name to create a bridge to the suggestion cards below.",
  "featured_plant": "The latin name of whichever suggested plant you consider most visually striking or characterful — used to source a pull image for the narrative body.",
  "suggestions": [
    {
      "common_name": "string — use the most widely recognised, user-friendly common name",
      "latin_name": "string — accurate species-level binomial where possible, avoiding cultivar names, to support reliable image lookup",
      "tier": "back | mid | ground",
      "height_cm": number,
      "flowering_months": [array of month numbers 1-12],
      "why": "1-2 sentences explaining why this plant works specifically with the existing selection — reference the existing plants where relevant, not just the plant's general qualities",
      "wildlife_value": true | false,
      "drought_tolerant": true | false,
      "edible": true | false,
      "british_native": true | false
    }
  ]
}

Return ${SUGGESTION_COUNT[prefs.space]} suggestions appropriate to the space size. Ensure at least 2 ground cover suggestions. Categorise each into tier: back (tall, structural, 80cm+), mid (border plants, 40-80cm), ground (low-growing, spreading, under 40cm). Return ONLY valid JSON, no markdown, no preamble.`;
}

const VALID_TIERS: SchemeTier[] = ["back", "mid", "ground"];

function parseSuggestion(raw: unknown): ParsedSuggestion | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  if (typeof r.common_name !== "string" || typeof r.latin_name !== "string" || typeof r.why !== "string") return null;
  if (typeof r.tier !== "string" || !(VALID_TIERS as string[]).includes(r.tier)) return null;

  const heightCm = typeof r.height_cm === "number" && Number.isFinite(r.height_cm) ? Math.round(r.height_cm) : null;

  const floweringMonths = Array.isArray(r.flowering_months)
    ? r.flowering_months.map(validMonth).filter((m): m is number => m !== null)
    : null;

  return {
    common_name: r.common_name,
    latin_name: r.latin_name,
    tier: r.tier as SchemeTier,
    height_cm: heightCm,
    flowering_months: floweringMonths && floweringMonths.length ? floweringMonths : null,
    why: r.why,
    wildlife_value: r.wildlife_value === true,
    drought_tolerant: r.drought_tolerant === true,
    edible: r.edible === true,
    british_native: r.british_native === true,
  };
}

export async function generateScheme(
  plants: SourcePlantInput[],
  prefs: SchemePreferences
): Promise<SchemeGenerationResult> {
  const prompt = buildSchemePrompt(plants, prefs);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  console.log(
    `[scheme-generation] tokens: input=${message.usage.input_tokens} output=${message.usage.output_tokens} stop_reason=${message.stop_reason}`
  );

  const rawText = message.content[0].type === "text" ? message.content[0].text.trim() : "";
  const text = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const raw: unknown = JSON.parse(text);

  if (typeof raw !== "object" || raw === null) throw new Error("Invalid response shape");
  const r = raw as Record<string, unknown>;

  if (typeof r.narrative_intro !== "string" || typeof r.narrative_body !== "string") {
    throw new Error("Invalid response shape");
  }
  if (!Array.isArray(r.suggestions)) throw new Error("Invalid response shape");

  const suggestions = r.suggestions.map(parseSuggestion).filter((s): s is ParsedSuggestion => s !== null);
  if (suggestions.length === 0) throw new Error("No valid suggestions returned");

  const featuredPlantLatin =
    typeof r.featured_plant === "string" && suggestions.some((s) => s.latin_name === r.featured_plant)
      ? r.featured_plant
      : null;

  return {
    narrative_intro: r.narrative_intro,
    narrative_body: r.narrative_body,
    featured_plant_latin: featuredPlantLatin,
    suggestions,
  };
}

const SEASON_FOR_MONTH: Record<number, string> = {
  12: "Winter", 1: "Winter", 2: "Winter",
  3: "Spring", 4: "Spring", 5: "Spring",
  6: "Summer", 7: "Summer", 8: "Summer",
  9: "Autumn", 10: "Autumn", 11: "Autumn",
};

function dominantCharacteristic(suggestions: ParsedSuggestion[]): string {
  const counts = {
    wildlife: suggestions.filter((s) => s.wildlife_value).length,
    edible: suggestions.filter((s) => s.edible).length,
    drought: suggestions.filter((s) => s.drought_tolerant).length,
  };

  if (counts.wildlife >= counts.edible && counts.wildlife >= counts.drought && counts.wildlife > 0) {
    return "pollinator border";
  }
  if (counts.edible >= counts.drought && counts.edible > 0) return "kitchen garden";
  if (counts.drought > 0) return "drought-tolerant border";
  return "planting scheme";
}

/** Auto-generated scheme name: "[Season] [dominant characteristic] · [Month Year]". */
export function generateSchemeName(suggestions: ParsedSuggestion[], now = new Date()): string {
  const month = now.getMonth() + 1;
  const season = SEASON_FOR_MONTH[month];
  const characteristic = dominantCharacteristic(suggestions);
  const monthName = MONTH_NAMES[month - 1];
  return `${season} ${characteristic} · ${monthName} ${now.getFullYear()}`;
}
