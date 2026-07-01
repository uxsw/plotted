import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { performFloweringLookup } from "@/lib/plant-lookup";
import { fetchWikimediaImage } from "@/lib/wikimedia";
import {
  generateScheme,
  generateSchemeName,
  type SourcePlantInput,
} from "@/lib/scheme-generation";
import type { SchemeSpace } from "@/lib/types";

const VALID_SPACES: SchemeSpace[] = ["small", "medium", "large"];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const plantIds = b.plant_ids;
  if (
    !Array.isArray(plantIds) ||
    plantIds.length < 1 ||
    plantIds.length > 5 ||
    !plantIds.every((id) => typeof id === "string")
  ) {
    return NextResponse.json({ error: "plant_ids must be an array of 1–5 strings" }, { status: 400 });
  }

  if (typeof b.space !== "string" || !(VALID_SPACES as string[]).includes(b.space)) {
    return NextResponse.json({ error: "space must be one of small, medium, large" }, { status: 400 });
  }
  const space = b.space as SchemeSpace;

  const successional = b.successional === true;
  const edible = b.edible === true;

  const { data: plantRows, error: plantsError } = await supabase
    .from("plants")
    .select("id, genus, species, cultivar, common_names, sun_needs, flowering_season_from, flowering_season_to, eventual_height_cm")
    .in("id", plantIds)
    .eq("user_id", user.id);

  if (plantsError) {
    return NextResponse.json({ error: plantsError.message }, { status: 500 });
  }
  if (!plantRows || plantRows.length === 0) {
    return NextResponse.json({ error: "No matching plants found" }, { status: 404 });
  }

  // Pre-flight enrichment: backfill flowering season for plants missing it, in parallel.
  const enriched = await Promise.all(
    plantRows.map(async (p) => {
      if (p.flowering_season_from && p.flowering_season_to) return p;
      try {
        const result = await performFloweringLookup(p.genus, p.species, p.cultivar);
        return {
          ...p,
          flowering_season_from: result.flowering_season_from,
          flowering_season_to: result.flowering_season_to,
        };
      } catch {
        return p;
      }
    })
  );

  const sourcePlants: SourcePlantInput[] = enriched.map((p) => ({
    genus: p.genus,
    species: p.species,
    cultivar: p.cultivar,
    common_names: p.common_names ?? [],
    sun_needs: p.sun_needs,
    flowering_season_from: p.flowering_season_from,
    flowering_season_to: p.flowering_season_to,
    eventual_height_cm: p.eventual_height_cm,
  }));

  let generated;
  try {
    generated = await generateScheme(sourcePlants, { space, successional, edible });
  } catch (err) {
    console.error("Scheme generation failed:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 502 });
  }

  const images = await Promise.all(
    generated.suggestions.map((s) => fetchWikimediaImage(s.latin_name))
  );

  const name = generateSchemeName(generated.suggestions);

  const { data: scheme, error: schemeError } = await supabase
    .from("schemes")
    .insert({
      name,
      space,
      successional,
      edible,
      narrative_intro: generated.narrative_intro,
      narrative_body: generated.narrative_body,
      featured_plant_latin: generated.featured_plant_latin,
    })
    .select("id")
    .single();

  if (schemeError || !scheme) {
    return NextResponse.json({ error: schemeError?.message ?? "Failed to save scheme" }, { status: 500 });
  }

  const { error: sourcePlantsError } = await supabase.from("scheme_source_plants").insert(
    plantIds.map((plant_id, index) => ({
      scheme_id: scheme.id,
      plant_id,
      sort_order: index,
    }))
  );
  if (sourcePlantsError) {
    return NextResponse.json({ error: sourcePlantsError.message }, { status: 500 });
  }

  const { error: suggestionsError } = await supabase.from("scheme_suggestions").insert(
    generated.suggestions.map((s, index) => ({
      scheme_id: scheme.id,
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
    return NextResponse.json({ error: suggestionsError.message }, { status: 500 });
  }

  return NextResponse.json({ scheme_id: scheme.id });
}
