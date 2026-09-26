import { NextRequest, NextResponse, after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { enrichPlants, runAndPersistSelectionScheme } from "@/app/api/schemes/_lib";
import { buildSelectionInput, type GardenPlantRow } from "@/lib/scheme-selection";
import { STALE_GENERATING_MS } from "@/lib/scheme-generation-timing";
import type { PersistedDraftState } from "@/app/(app)/plant-scheme/_components/PlantSchemeContext";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GARDEN_COLUMNS =
  "id, genus, species, cultivar, common_names, sun_needs, flowering_season_from, flowering_season_to, eventual_height_cm";

/**
 * Turns a saved draft into a real scheme: creates (or reuses) the `schemes`
 * row, records the source plants, and generates the write-up in the
 * background — the client polls /api/schemes/[id]/status, as the /schemes
 * journey does. The draft is only touched on success (see finalizeDraft), so a
 * failed attempt leaves it resumable and this route can simply be called again.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  if (!UUID_RE.test(draftId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: draft, error: draftError } = await supabase
    .from("plant_scheme_drafts")
    .select("id, status, scheme_id, state")
    .eq("id", draftId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (draftError) return NextResponse.json({ error: draftError.message }, { status: 500 });
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (draft.status === "saved" && draft.scheme_id) {
    return NextResponse.json({ scheme_id: draft.scheme_id, status: "complete" });
  }

  const state = (draft.state ?? {}) as Partial<PersistedDraftState>;

  // At most one scheme per draft (unique index on schemes.draft_id).
  const { data: existing } = await supabase
    .from("schemes")
    .select("id, status")
    .eq("draft_id", draftId)
    .maybeSingle();

  let schemeId: string;

  if (existing) {
    if (existing.status === "complete") {
      // The scheme finished but the draft never got its 'saved' stamp — finish that now.
      await finalizeDraft(supabase, draftId, user.id, existing.id);
      return NextResponse.json({ scheme_id: existing.id, status: "complete" });
    }

    // Reclaim a failed scheme (or one abandoned mid-generation). Conditional, so a
    // racing second request finds nothing to claim and just reports "generating".
    const staleCutoff = new Date(Date.now() - STALE_GENERATING_MS).toISOString();
    const { data: claimed } = await supabase
      .from("schemes")
      .update({ status: "generating" })
      .eq("id", existing.id)
      .or(`status.eq.failed,and(status.eq.generating,updated_at.lt.${staleCutoff})`)
      .select("id");

    if (!claimed || claimed.length === 0) {
      return NextResponse.json({ scheme_id: existing.id, status: "generating" });
    }
    schemeId = existing.id;
  }

  const gardenIds = (state.schemePlants ?? []).filter((p) => p.origin === "garden").map((p) => p.plantId);
  let gardenRows: GardenPlantRow[] = [];
  if (gardenIds.length > 0) {
    const { data: rows, error: plantsError } = await supabase
      .from("plants")
      .select(GARDEN_COLUMNS)
      .in("id", gardenIds)
      .eq("user_id", user.id);
    if (plantsError) {
      if (existing) await markFailed(supabase, existing.id);
      return NextResponse.json({ error: plantsError.message }, { status: 500 });
    }
    gardenRows = (rows ?? []) as GardenPlantRow[];
  }

  const input = buildSelectionInput(state, gardenRows);
  if (input.plants.length === 0) {
    if (existing) await markFailed(supabase, existing.id);
    return NextResponse.json({ error: "Add at least one plant before saving" }, { status: 400 });
  }

  if (!existing) {
    const { data: created, error: schemeError } = await supabase
      .from("schemes")
      .insert({
        origin: "conversation",
        draft_id: draftId,
        // Not asked in the question flow yet; a fixed default until it is.
        space: "medium",
        successional: true,
        edible: input.edible,
        status: "generating",
      })
      .select("id")
      .single();

    if (schemeError || !created) {
      if (schemeError?.code === "23505") {
        // A concurrent save created it first.
        const { data: raced } = await supabase.from("schemes").select("id").eq("draft_id", draftId).maybeSingle();
        if (raced) return NextResponse.json({ scheme_id: raced.id, status: "generating" });
      }
      return NextResponse.json({ error: schemeError?.message ?? "Failed to create scheme" }, { status: 500 });
    }
    schemeId = created.id;
  } else {
    // Retry: replace whatever the failed attempt left behind.
    const [{ error: delPlantsError }, { error: delSuggestionsError }] = await Promise.all([
      supabase.from("scheme_source_plants").delete().eq("scheme_id", schemeId!),
      supabase.from("scheme_suggestions").delete().eq("scheme_id", schemeId!),
    ]);
    if (delPlantsError || delSuggestionsError) {
      await markFailed(supabase, schemeId!);
      return NextResponse.json(
        { error: (delPlantsError ?? delSuggestionsError)!.message },
        { status: 500 }
      );
    }
  }

  const { error: sourcePlantsError } = await supabase.from("scheme_source_plants").insert(
    input.plants.map((p, index) => ({
      scheme_id: schemeId!,
      plant_id: p.plantId,
      common_name: p.commonName,
      latin_name: p.latinName,
      sort_order: index,
    }))
  );
  if (sourcePlantsError) {
    await markFailed(supabase, schemeId!);
    return NextResponse.json({ error: sourcePlantsError.message }, { status: 500 });
  }

  const finalSchemeId = schemeId!;
  after(async () => {
    try {
      // Fill in flowering seasons the garden records are missing, then build the
      // prompt input from the enriched rows.
      const enriched = await enrichPlants(gardenRows);
      const enrichedRows = gardenRows.map((row, i) => ({
        ...row,
        flowering_season_from: enriched[i].flowering_season_from,
        flowering_season_to: enriched[i].flowering_season_to,
      }));
      const generationInput = buildSelectionInput(state, enrichedRows);

      const result = await runAndPersistSelectionScheme(
        supabase,
        finalSchemeId,
        generationInput.plants,
        generationInput.brief
      );
      if (!result.ok) {
        console.error(`[plant-scheme/save] generation failed for ${finalSchemeId}:`, result.error);
        return;
      }
      await finalizeDraft(supabase, draftId, user.id, finalSchemeId);
    } catch (err) {
      console.error(`[plant-scheme/save] unexpected failure for ${finalSchemeId}:`, err);
      await markFailed(supabase, finalSchemeId);
    }
  });

  return NextResponse.json({ scheme_id: finalSchemeId, status: "generating" });
}

async function markFailed(supabase: SupabaseClient, schemeId: string) {
  await supabase.from("schemes").update({ status: "failed" }).eq("id", schemeId);
}

/**
 * The draft's success transition: status 'saved', linked to the scheme, and
 * its transcript dropped — the saved scheme is the durable artifact from here
 * on. State is re-read rather than reused from the request, and the update is
 * conditional on the draft still being open, so it never clobbers a newer write.
 */
async function finalizeDraft(
  supabase: SupabaseClient,
  draftId: string,
  userId: string,
  schemeId: string
) {
  const { data: fresh } = await supabase
    .from("plant_scheme_drafts")
    .select("state")
    .eq("id", draftId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!fresh) return;

  const { error } = await supabase
    .from("plant_scheme_drafts")
    .update({
      status: "saved",
      scheme_id: schemeId,
      state: { ...(fresh.state as Record<string, unknown>), transcript: [] },
    })
    .eq("id", draftId)
    .eq("user_id", userId)
    .eq("status", "draft");

  if (error) console.error(`[plant-scheme/save] failed to finalize draft ${draftId}:`, error);
}
