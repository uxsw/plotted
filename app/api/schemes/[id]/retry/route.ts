import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enrichPlants, toSourcePlantInputs, runAndPersistGeneration } from "@/app/api/schemes/_lib";
import type { SchemeSpace } from "@/lib/types";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: scheme, error: schemeError } = await supabase
    .from("schemes")
    .select("id, status, space, successional, edible")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (schemeError || !scheme) {
    return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
  }

  if (scheme.status !== "failed") {
    return NextResponse.json({ error: "Only failed schemes can be retried" }, { status: 409 });
  }

  // Fetch source plants joined to the current plant library data.
  const { data: sourcePlantRows, error: sourcePlantsError } = await supabase
    .from("scheme_source_plants")
    .select("plant_id, sort_order, plants ( genus, species, cultivar, common_names, sun_needs, flowering_season_from, flowering_season_to, eventual_height_cm )")
    .eq("scheme_id", id)
    .order("sort_order");

  if (sourcePlantsError) {
    return NextResponse.json({ error: sourcePlantsError.message }, { status: 500 });
  }

  // Skip rows where plant_id is null — plant was deleted before the soft-delete fix landed.
  const validRows = (sourcePlantRows ?? []).filter(
    (row) => row.plant_id !== null && row.plants !== null
  );

  if (validRows.length === 0) {
    return NextResponse.json(
      { error: "This scheme can't be retried because the original plants are no longer available." },
      { status: 422 }
    );
  }

  const plantData = validRows.map((row) => {
    const p = Array.isArray(row.plants) ? row.plants[0] : row.plants;
    return p!;
  });

  // Conditional update: only move to 'generating' if the row is still 'failed'.
  // If two retry requests race, the second will find 0 rows updated and return 409.
  const { data: claimed } = await supabase
    .from("schemes")
    .update({ status: "generating" })
    .eq("id", id)
    .eq("status", "failed")
    .select("id");

  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ error: "This scheme is already being retried." }, { status: 409 });
  }

  const enriched = await enrichPlants(plantData);
  const sourcePlants = toSourcePlantInputs(enriched);

  const prefs = {
    space: scheme.space as SchemeSpace,
    successional: scheme.successional as boolean,
    edible: scheme.edible as boolean,
  };

  const result = await runAndPersistGeneration(supabase, id, sourcePlants, prefs);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ scheme_id: id });
}
