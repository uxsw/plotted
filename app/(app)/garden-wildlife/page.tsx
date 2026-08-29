import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import WildlifeGrid, { type SpeciesRow } from "@/components/WildlifeGrid";

export const metadata: Metadata = {
  title: "Garden birds | Plotted",
};

export default async function GardenWildlifePage() {
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="o-type-display pica kirk text-ink">Garden birds</h1>
        <p className="brevier text-ink-soft">
          Tick off the birds you&apos;ve spotted in your garden.
        </p>
      </div>
      <WildlifeGrid initialSpecies={(species ?? []) as SpeciesRow[]} initialSpottedIds={spottedIds} />
    </div>
  );
}
