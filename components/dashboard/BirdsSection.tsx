import { createClient } from "@/lib/supabase/server";
import WildlifeGrid, { type SpeciesRow } from "@/components/WildlifeGrid";

export default async function BirdsSection() {
  const supabase = await createClient();

  const [{ data: species }, { data: sightings }] = await Promise.all([
    supabase
      .from("species")
      .select("id, name, image_path, description, sort_order")
      .eq("category", "bird")
      .order("sort_order"),
    supabase
      .from("user_species_sightings")
      .select("species_id"),
  ]);

  const spottedIds = (sightings ?? []).map((s) => s.species_id as string);

  return (
    <section aria-label="Bird spotter">
      <h2 className="font-display font-medium text-xl text-ink mb-3">Bird spotter</h2>
      <WildlifeGrid
        initialSpecies={(species ?? []) as SpeciesRow[]}
        initialSpottedIds={spottedIds}
      />
    </section>
  );
}
