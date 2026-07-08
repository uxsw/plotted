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

  const { data: plant } = await supabase
    .from("plants")
    .select("species, cultivar")
    .eq("id", id)
    .eq("status", "active")
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

  try {
    const result = await performLookup(plant.species, plant.cultivar ?? null);
    const { updates, lookup_status } = applyLookupResult(result, { species: plant.species, cultivar: plant.cultivar ?? null });
    await supabase.from("plants").update({ ...updates, lookup_status }).eq("id", id);
    return NextResponse.json({ ...result, ...updates, lookup_status });
  } catch {
    await supabase.from("plants").update({ lookup_status: "error" }).eq("id", id);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
