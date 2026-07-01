import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SchemeNewForm from "@/components/SchemeNewForm";

export const metadata: Metadata = {
  title: "New Planting Scheme | Plotted",
};

export default async function NewSchemePage() {
  const supabase = await createClient();
  const { data: plants } = await supabase
    .from("plants")
    .select("id, photo_url, genus, species, cultivar, common_names")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return <SchemeNewForm plants={plants ?? []} />;
}
