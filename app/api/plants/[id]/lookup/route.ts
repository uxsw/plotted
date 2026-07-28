import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { performLookup } from "@/lib/plant-lookup";
import { applyLookupResult } from "@/lib/lookup-apply";

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

  // RLS ensures only the plant owner can access this row
  const { data: plant } = await supabase
    .from("plants")
    .select("genus, species, cultivar, common_names, species_source")
    .eq("id", id)
    .eq("status", "active")
    .eq("user_id", user.id)
    .single();

  if (!plant) {
    return NextResponse.json({ error: "Plant not found" }, { status: 404 });
  }

  if (!plant.species) {
    return NextResponse.json({
      common_names: [],
      sun_needs: null,
      flowering_season_from: null,
      flowering_season_to: null,
      eventual_height_cm: null,
      eventual_spread_cm: null,
    });
  }

  // Read back the persisted origin — this route retries an already-saved
  // plant, so it can't be told fromIdentification at call time the way
  // upsertPlant is; species_source is what makes that gate available here.
  // null (rows predating this column) behaves as 'manual' always did.
  const fromIdentification = plant.species_source === "identification";

  try {
    const result = await performLookup(plant.genus, plant.species, plant.cultivar ?? null);
    const { updates, lookup_status } = applyLookupResult(
      result,
      { species: plant.species, cultivar: plant.cultivar ?? null },
      {
        skipCorrection: fromIdentification,
        existingCommonNames: fromIdentification ? plant.common_names : undefined,
      }
    );
    // RLS ensures only the plant owner can update
    await supabase.from("plants").update({ ...updates, lookup_status }).eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ...result, ...updates, lookup_status });
  } catch {
    // RLS ensures only the plant owner can update
    await supabase.from("plants").update({ lookup_status: "error" }).eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
