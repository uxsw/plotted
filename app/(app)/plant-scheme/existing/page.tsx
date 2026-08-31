import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import GardenPlantPicker from "../_components/GardenPlantPicker";

export const metadata: Metadata = {
  title: "Pick garden plants | Plotted",
};

export default async function PlantSchemeExistingPage() {
  const supabase = await createClient();
  const { data: plants } = await supabase
    .from("plants")
    .select("id, photo_url, genus, species, cultivar, common_names")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return <GardenPlantPicker plants={plants ?? []} />;
}
