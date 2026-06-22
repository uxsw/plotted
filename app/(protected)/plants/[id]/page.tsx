import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlantDetail from "@/components/PlantDetail";

export default async function PlantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: plant } = await supabase.from("plants").select("*").eq("id", id).single();

  if (!plant) notFound();

  return <PlantDetail plant={plant} />;
}
