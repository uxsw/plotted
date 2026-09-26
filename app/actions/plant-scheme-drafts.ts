"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  PersistedDraftState,
  SchemePath,
  SchemePhase,
} from "@/app/(app)/plant-scheme/_components/PlantSchemeContext";

export async function createPlantSchemeDraft(input: {
  path: SchemePath;
  phase: SchemePhase;
  state: PersistedDraftState;
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data, error } = await supabase
    .from("plant_scheme_drafts")
    .insert({ user_id: user.id, path: input.path, phase: input.phase, state: input.state })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createPlantSchemeDraft] insert failed:", error);
    return { error: error?.message ?? "Insert returned no row" };
  }
  return { id: data.id };
}

export async function updatePlantSchemeDraft(
  id: string,
  input: { phase: SchemePhase; state: PersistedDraftState }
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("plant_scheme_drafts")
    .update({ phase: input.phase, state: input.state })
    .eq("id", id)
    .eq("user_id", user.id)
    // A saved draft's state is final (its transcript was cleared on save); a
    // stale client write must not resurrect it.
    .eq("status", "draft");

  if (error) {
    console.error("[updatePlantSchemeDraft] update failed:", error);
    return { error: error.message };
  }
}
