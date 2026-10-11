import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SchemeResults from "@/components/SchemeResults";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: scheme } = await supabase.from("schemes").select("name").eq("id", id).single();

  return {
    title: scheme?.name ? `${scheme.name} | Plotted` : "Planting Scheme | Plotted",
  };
}

export default async function SchemeResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: scheme } = await supabase.from("schemes").select("*").eq("id", id).single();
  if (!scheme) notFound();
  if (scheme.status !== "complete") redirect("/schemes");

  const [{ data: sourcePlants }, { data: suggestions }, { data: listItems }] = await Promise.all([
    supabase
      .from("scheme_source_plants")
      .select("sort_order, plant_id, plants ( photo_url )")
      .eq("scheme_id", id)
      .order("sort_order"),
    supabase
      .from("scheme_suggestions")
      .select("*")
      .eq("scheme_id", id)
      .eq("saved", true)
      .order("sort_order"),
    supabase
      .from("shopping_list_items")
      .select("species")
      .eq("scheme_id", id),
  ]);

  // Hero image: the first source plant (by sort_order) that has its own uploaded photo.
  const heroImage: string | null =
    (sourcePlants ?? [])
      .map((sp) => {
        const plant = Array.isArray(sp.plants) ? sp.plants[0] : sp.plants;
        return plant?.photo_url ?? null;
      })
      .find((url): url is string => !!url) ?? null;

  // Which of the scheme's plants are the gardener's own. New rows carry
  // plant_id themselves. A conversational scheme saved before that column
  // existed is matched through its source plants instead: both lists were
  // written from the same plant list, in the same order.
  const sourcePlantIdByOrder = new Map(
    scheme.origin === "conversation"
      ? (sourcePlants ?? []).flatMap((sp) => (sp.plant_id ? [[sp.sort_order, sp.plant_id] as const] : []))
      : []
  );
  const gardenPlantIds: Record<string, string> = {};
  for (const s of suggestions ?? []) {
    const plantId = s.plant_id ?? sourcePlantIdByOrder.get(s.sort_order);
    if (plantId) gardenPlantIds[s.id] = plantId;
  }

  return (
    <SchemeResults
      scheme={scheme}
      suggestions={suggestions ?? []}
      heroImage={heroImage}
      onListLatin={(listItems ?? []).flatMap((item) => (item.species ? [item.species] : []))}
      gardenPlantIds={gardenPlantIds}
    />
  );
}
