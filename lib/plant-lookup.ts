import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const VALID_SUN_NEEDS = [
  "full sun",
  "partial shade",
  "full shade",
  "full sun / partial shade",
] as const;

export type LookupResult = {
  common_names: string[];
  sun_needs: string | null;
  flowering_season_from: number | null;
  flowering_season_to: number | null;
  eventual_height_cm: number | null;
  eventual_spread_cm: number | null;
};

export async function performLookup(
  species: string,
  cultivar: string | null
): Promise<LookupResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `You are a botanical reference assistant with knowledge of UK growing conditions.

Given a plant's scientific species name and optional cultivar, return the following data as a JSON object. Base all values on typical UK conditions.

Species: ${species}
Cultivar: ${cultivar ?? ""} (may be empty — if so, base values on the species)

Return ONLY a valid JSON object, no preamble, no markdown, no explanation.

{
  "common_names": [],
  "sun_needs": null,
  "flowering_season_from": null,
  "flowering_season_to": null,
  "eventual_height_cm": null,
  "eventual_spread_cm": null
}

Field notes:
- common_names: string[] — common names used in the UK. Empty array if none known.
- sun_needs: one of exactly "full sun", "partial shade", "full shade", "full sun / partial shade". Null if unknown.
- flowering_season_from: month number 1–12 for typical UK flowering start. Null if unknown or doesn't flower.
- flowering_season_to: month number 1–12 for typical UK flowering end. Null if unknown or doesn't flower.
- eventual_height_cm: mature height in cm as a whole integer. Null if unknown.
- eventual_spread_cm: mature spread in cm as a whole integer. Null if unknown.`,
      },
    ],
  });

  const raw_text =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";
  // Strip markdown code fences if the model wraps the response despite instructions
  const text = raw_text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const raw: unknown = JSON.parse(text);

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("Invalid response shape");
  }
  const r = raw as Record<string, unknown>;

  const common_names =
    Array.isArray(r.common_names) &&
    r.common_names.every((n) => typeof n === "string")
      ? (r.common_names as string[])
      : [];

  const sun_needs =
    typeof r.sun_needs === "string" &&
    (VALID_SUN_NEEDS as readonly string[]).includes(r.sun_needs)
      ? r.sun_needs
      : null;

  function validMonth(v: unknown): number | null {
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    const n = Math.round(v);
    return n >= 1 && n <= 12 ? n : null;
  }

  function validCm(v: unknown): number | null {
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
    return Math.round(v);
  }

  return {
    common_names,
    sun_needs,
    flowering_season_from: validMonth(r.flowering_season_from),
    flowering_season_to: validMonth(r.flowering_season_to),
    eventual_height_cm: validCm(r.eventual_height_cm),
    eventual_spread_cm: validCm(r.eventual_spread_cm),
  };
}
