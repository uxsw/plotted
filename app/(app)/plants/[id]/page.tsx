import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlantDetail from "@/components/PlantDetail";

export default async function PlantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: plant }, { data: { user } }] = await Promise.all([
    supabase.from("plants").select("*").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);

  if (!plant) notFound();

  const { data: flags } = user
    ? await supabase.from("user_flags").select("ai_lookup_enabled").eq("user_id", user.id).single()
    : { data: null };

  return <PlantDetail plant={plant} aiLookupEnabled={flags?.ai_lookup_enabled ?? false} />;
}
