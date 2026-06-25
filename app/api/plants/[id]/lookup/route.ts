import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { performLookup } from "@/lib/plant-lookup";

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

  const { data: flags } = await supabase
    .from("user_flags")
    .select("ai_lookup_enabled")
    .eq("user_id", user.id)
    .single();

  if (!flags?.ai_lookup_enabled) {
    return NextResponse.json({ error: "Feature not available" }, { status: 403 });
  }

  const { data: plant } = await supabase
    .from("plants")
    .select("species, cultivar")
    .eq("id", id)
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
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
