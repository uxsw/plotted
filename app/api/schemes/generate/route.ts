import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SchemeSpace } from "@/lib/types";
import { enrichPlants, toSourcePlantInputs, runAndPersistGeneration } from "@/app/api/schemes/_lib";

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
    .eq("user_id", user.id)
    .eq("status", "active");

  if (plantsError) {
    return NextResponse.json({ error: plantsError.message }, { status: 500 });
  }
  if (!plantRows || plantRows.length === 0) {
    return NextResponse.json({ error: "No matching plants found" }, { status: 404 });
  }

  // Create the scheme row before generation so failures are persisted and retryable.
  const { data: scheme, error: schemeError } = await supabase
    .from("schemes")
    .insert({ space, successional, edible, status: "generating" })
    .select("id")
    .single();

  if (schemeError || !scheme) {
    return NextResponse.json({ error: schemeError?.message ?? "Failed to create scheme" }, { status: 500 });
  }

  // Persist the plant selection so it survives a failure and can be retried.
  const { error: sourcePlantsError } = await supabase.from("scheme_source_plants").insert(
    plantIds.map((plant_id, index) => ({
      scheme_id: scheme.id,
      plant_id,
      sort_order: index,
    }))
  );
  if (sourcePlantsError) {
    await supabase.from("schemes").update({ status: "failed" }).eq("id", scheme.id);
    return NextResponse.json({ error: sourcePlantsError.message }, { status: 500 });
  }

  const enrichmentStart = Date.now();
  const enriched = await enrichPlants(plantRows);
  console.log(`[schemes/generate] enrichment: ${Date.now() - enrichmentStart}ms`);

  const sourcePlants = toSourcePlantInputs(enriched);
  const result = await runAndPersistGeneration(supabase, scheme.id, sourcePlants, { space, successional, edible });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ scheme_id: scheme.id });
}
