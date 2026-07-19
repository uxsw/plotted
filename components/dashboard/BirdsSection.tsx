import { createClient } from "@/lib/supabase/server";
import { BirdCardScroller } from "@/components/dashboard/BirdCardScroller";
import type { SpeciesRow } from "@/components/WildlifeGrid";

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
    <section aria-label="Garden visitors">
      <h2 className="font-display font-medium text-xl text-ink mb-1">Garden visitors</h2>
      <p className="font-sans text-sm text-ink-soft mb-4">Birds you might spot nearby this season. Tick them off as you go.</p>
      <BirdCardScroller
        initialSpecies={(species ?? []) as SpeciesRow[]}
        initialSpottedIds={spottedIds}
      />
    </section>
  );
}
