import { performFloweringLookup } from "@/lib/plant-lookup";
import { fetchWikimediaImages } from "@/lib/wikimedia";
import { generateScheme, type SourcePlantInput, type SchemePreferences } from "@/lib/scheme-generation";
import type { SupabaseClient } from "@supabase/supabase-js";

type PlantRow = {
  genus: string;
  species: string | null;
  cultivar: string | null;
  common_names: string[] | null;
  sun_needs: string | null;
  flowering_season_from: number | null;
  flowering_season_to: number | null;
  eventual_height_cm: number | null;
};

export async function enrichPlants(plants: PlantRow[]): Promise<PlantRow[]> {
  return Promise.all(
    plants.map(async (p) => {
      if (p.flowering_season_from && p.flowering_season_to) return p;
      try {
        const result = await performFloweringLookup(p.genus, p.species, p.cultivar);
        return { ...p, flowering_season_from: result.flowering_season_from, flowering_season_to: result.flowering_season_to };
      } catch {
        return p;
      }
    })
  );
}

export function toSourcePlantInputs(plants: PlantRow[]): SourcePlantInput[] {
  return plants.map((p) => ({
    genus: p.genus,
    species: p.species,
    cultivar: p.cultivar,
    common_names: p.common_names ?? [],
    sun_needs: p.sun_needs,
    flowering_season_from: p.flowering_season_from,
    flowering_season_to: p.flowering_season_to,
    eventual_height_cm: p.eventual_height_cm,
  }));
}

type RunResult = { ok: true } | { ok: false; error: string; httpStatus: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runAndPersistGeneration(
  supabase: SupabaseClient<any>,
  schemeId: string,
  sourcePlants: SourcePlantInput[],
  prefs: SchemePreferences
): Promise<RunResult> {
  const aiStart = Date.now();
  let generated;
  try {
    generated = await generateScheme(sourcePlants, prefs);
  } catch (err) {
    console.error("[scheme] generation failed:", err);
    await supabase.from("schemes").update({ status: "failed" }).eq("id", schemeId);
    return { ok: false, error: "Generation failed", httpStatus: 502 };
  }
  console.log(`[scheme] AI: ${Date.now() - aiStart}ms (${generated.suggestions.length} suggestions)`);

  const images = await fetchWikimediaImages(generated.suggestions.map((s) => s.latin_name));

  // Insert suggestions before marking the scheme complete so a failed insert lands as
  // status = 'failed' rather than leaving the scheme complete with zero suggestions.
  const { error: suggestionsError } = await supabase.from("scheme_suggestions").insert(
    generated.suggestions.map((s, index) => ({
      scheme_id: schemeId,
      common_name: s.common_name,
      latin_name: s.latin_name,
      tier: s.tier,
      height_cm: s.height_cm,
      flowering_months: s.flowering_months,
      why: s.why,
      wildlife_value: s.wildlife_value,
      drought_tolerant: s.drought_tolerant,
      edible: s.edible,
      british_native: s.british_native,
      wikimedia_image_url: images[index]?.url ?? null,
      wikimedia_attribution: images[index]?.attribution ?? null,
      sort_order: index,
    }))
  );

  if (suggestionsError) {
    await supabase.from("schemes").update({ status: "failed" }).eq("id", schemeId);
    return { ok: false, error: suggestionsError.message, httpStatus: 500 };
  }

  const { error: updateError } = await supabase
    .from("schemes")
    .update({
      status: "complete",
      name: generated.name,
      summary: generated.summary,
      narrative_intro: generated.narrative_intro,
      narrative_body: generated.narrative_body,
      featured_plant_latin: generated.featured_plant_latin,
    })
    .eq("id", schemeId);

  if (updateError) {
    await supabase.from("schemes").update({ status: "failed" }).eq("id", schemeId);
    return { ok: false, error: updateError.message, httpStatus: 500 };
  }

  return { ok: true };
}
