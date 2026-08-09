import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";
import { computeSpeciesMatchKey } from "@/lib/species-match-key";
import { sanitizeGenus, sanitizeSpecies, sanitizePlantName } from "@/lib/sanitize";
import { PENDING_STALE_MS } from "@/lib/species-reference-timing";

const anthropic = new Anthropic();

const FAILED_STALE_MS  = 24 * 60 * 60 * 1000; // 24 hours

type FrostLookupResult = {
  frost_tolerance_c: number | null;
  frost_tolerance_notice: string | null;
};

async function lookupFrostTolerance(
  genus: string,
  species: string | null | undefined,
  cultivar: string | null | undefined
): Promise<FrostLookupResult> {
  const plantDescription = [genus, species, cultivar].filter(Boolean).join(" ");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 128,
    messages: [
      {
        role: "user",
        content: `You are a botanical reference assistant with knowledge of UK growing conditions.

Given a plant, return its estimated minimum frost tolerance in °C as a JSON object.

Plant: ${plantDescription}

Return ONLY a valid JSON object, no preamble, no markdown, no explanation.

{
  "frost_tolerance_c": null,
  "frost_tolerance_notice": null
}

Field notes:
- frost_tolerance_c: estimated minimum temperature in °C the plant can survive as a whole integer (e.g. -5 for a plant tolerating down to -5°C). Null if unknown.
- frost_tolerance_notice: short hedge string shown alongside the value, e.g. "Estimated tolerance" or "Typical for this species". Null if frost_tolerance_c is null.`,
      },
    ],
  });

  const raw_text =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";
  const text = raw_text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const raw: unknown = JSON.parse(text);

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("Invalid response shape");
  }
  const r = raw as Record<string, unknown>;

  const frost_tolerance_c =
    typeof r.frost_tolerance_c === "number" && Number.isFinite(r.frost_tolerance_c)
      ? Math.round(r.frost_tolerance_c)
      : null;

  const frost_tolerance_notice =
    typeof r.frost_tolerance_notice === "string" && r.frost_tolerance_notice.trim()
      ? r.frost_tolerance_notice.trim()
      : null;

  return { frost_tolerance_c, frost_tolerance_notice };
}

/**
 * Background enrichment for species_reference.
 * Called via after() — must not throw; logs errors internally.
 *
 * Cache logic:
 * - No row: insert pending, then run AI lookup.
 * - Insert conflict (race — another process beat us): return.
 * - complete: return immediately (real cache hit).
 * - pending, updated_at within 10 min: return (genuinely in-flight).
 * - pending, updated_at older than 10 min: stale — re-run lookup, update in place.
 * - failed, updated_at within 24 h: return (avoid hammering API on a broken species).
 * - failed, updated_at older than 24 h: stale — re-run lookup, update in place.
 */
export async function enrichSpeciesReference(
  genus: string,
  species: string | null | undefined,
  cultivar: string | null | undefined
): Promise<void> {
  try {
    const match_key = computeSpeciesMatchKey(genus, species, cultivar);
    const db = createServiceClient();

    const { data: existing } = await db
      .from("species_reference")
      .select("id, lookup_status, updated_at")
      .eq("match_key", match_key)
      .maybeSingle();

    // Determine whether we should run (or re-run) the AI lookup.
    let rowId: string | null = null; // non-null means update in place instead of insert

    if (existing) {
      if (existing.lookup_status === "complete") return;

      const age = Date.now() - new Date(existing.updated_at).getTime();

      if (existing.lookup_status === "pending") {
        if (age < PENDING_STALE_MS) return; // genuinely in-flight
      } else if (existing.lookup_status === "failed") {
        if (age < FAILED_STALE_MS) return;  // recently failed, back off
      }

      // Stale pending or stale failed — re-run, updating the existing row.
      rowId = existing.id;
      await db
        .from("species_reference")
        .update({ lookup_status: "pending" })
        .eq("id", rowId);
    } else {
      const { error: insertError } = await db.from("species_reference").insert({
        genus: sanitizeGenus(genus),
        species: species ? sanitizeSpecies(species) : null,
        cultivar: cultivar ? sanitizePlantName(cultivar) : null,
        match_key,
        lookup_status: "pending",
      });

      // Unique constraint violation means another process inserted first — bail cleanly.
      if (insertError) return;
    }

    try {
      const result = await lookupFrostTolerance(genus, species, cultivar);
      const target = rowId
        ? db.from("species_reference").update({
            frost_tolerance_c: result.frost_tolerance_c,
            frost_tolerance_notice: result.frost_tolerance_notice,
            lookup_status: "complete",
          }).eq("id", rowId)
        : db.from("species_reference").update({
            frost_tolerance_c: result.frost_tolerance_c,
            frost_tolerance_notice: result.frost_tolerance_notice,
            lookup_status: "complete",
          }).eq("match_key", match_key);
      await target;
    } catch (aiErr) {
      console.error("[species-reference] AI lookup failed for", match_key, aiErr);
      const failTarget = rowId
        ? db.from("species_reference").update({ lookup_status: "failed" }).eq("id", rowId)
        : db.from("species_reference").update({ lookup_status: "failed" }).eq("match_key", match_key);
      await failTarget;
    }
  } catch (err) {
    console.error("[species-reference] enrichment error:", err);
  }
}
