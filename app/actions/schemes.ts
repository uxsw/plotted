"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPlantWithLookup } from "@/lib/plant-create";
import { parseScientificName } from "@/lib/identification/name";
import { sanitizePlantName } from "@/lib/sanitize";

export async function markSchemeAiNoticeSeen(schemeId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("schemes")
    .update({ ai_notice_seen_at: new Date().toISOString() })
    .eq("id", schemeId)
    .eq("user_id", user.id);
}

/** Marks the one-time /plant-scheme/welcome interstitial as shown, so a
 *  later visit goes straight to the hub. See lib/scheme-onboarding.ts. */
export async function markSchemeOnboardingSeen(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("user_flags")
    .upsert(
      { user_id: user.id, scheme_onboarding_seen_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
}

/** "Geum 'Mrs Bradshaw'" → the name without its cultivar, and the cultivar. */
function splitCultivar(latinName: string): { base: string; cultivar: string | null } {
  const match = latinName.match(/['‘]([^'’]+)['’]/);
  if (!match) return { base: latinName, cultivar: null };
  return { base: latinName.replace(match[0], " ").trim(), cultivar: sanitizePlantName(match[1]) || null };
}

export type PlantOutResult = { plantId: string } | { error: string };

/**
 * "Mark as planted" on the scheme page: the plant goes into the gardener's
 * garden (same insert + lookup + background enrichment as any other add, via
 * createPlantWithLookup) and the suggestion remembers which plant it became.
 * If the plant was waiting on the shopping list for this scheme, that entry
 * is cleared — it has been bought.
 */
export async function markSuggestionPlanted(schemeId: string, suggestionId: string): Promise<PlantOutResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: scheme } = await supabase
    .from("schemes")
    .select("id")
    .eq("id", schemeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!scheme) return { error: "Scheme not found" };

  const { data: suggestion } = await supabase
    .from("scheme_suggestions")
    .select("id, common_name, latin_name, height_cm, plant_id")
    .eq("id", suggestionId)
    .eq("scheme_id", schemeId)
    .maybeSingle();
  if (!suggestion) return { error: "Plant not found" };
  if (suggestion.plant_id) return { plantId: suggestion.plant_id };

  const { base, cultivar } = splitCultivar(suggestion.latin_name);
  const { genus, species } = parseScientificName(base);
  if (!genus && !species) return { error: "This plant has no name to add." };

  const now = new Date();
  const plant = await createPlantWithLookup(supabase, {
    genus,
    species,
    cultivar,
    common_names: suggestion.common_name ? [suggestion.common_name] : [],
    photo_url: null,
    status: "active",
    // Day is always stored as 1 (see Plant.date_planted).
    date_planted: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
    sun_needs: null,
    flowering_season_from: null,
    flowering_season_to: null,
    eventual_height_cm: suggestion.height_cm,
    eventual_spread_cm: null,
    notes: null,
    identification_status: "identified",
    species_source: "manual",
  });
  if ("error" in plant) {
    console.error("[scheme] plant-out insert failed:", plant.error);
    return { error: "Couldn't add the plant to your garden. Please try again." };
  }

  const { error: linkError } = await supabase
    .from("scheme_suggestions")
    .update({ plant_id: plant.id, planted_at: now.toISOString() })
    .eq("id", suggestionId)
    .eq("scheme_id", schemeId);
  // The plant exists, which is the visible success; a failed link only means
  // the scheme page will offer the button again.
  if (linkError) console.error("[scheme] plant-out link failed:", linkError);

  const { error: listError } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("user_id", user.id)
    .eq("scheme_id", schemeId)
    .eq("species", suggestion.latin_name);
  if (listError) console.error("[scheme] plant-out shopping list clear failed:", listError);

  revalidatePath("/plants");
  revalidatePath("/shopping-list");
  return { plantId: plant.id };
}
