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

  const [{ data: sourcePlants }, { data: suggestions }, { data: userFlags }] = await Promise.all([
    supabase
      .from("scheme_source_plants")
      .select("sort_order, plants ( photo_url )")
      .eq("scheme_id", id)
      .order("sort_order"),
    supabase
      .from("scheme_suggestions")
      .select("*")
      .eq("scheme_id", id)
      .eq("saved", true)
      .order("sort_order"),
    supabase
      .from("user_flags")
      .select("shopping_list_notice_seen_at")
      .maybeSingle(),
  ]);

  // Hero image: the first source plant (by sort_order) that has its own uploaded photo.
  const heroImage: string | null =
    (sourcePlants ?? [])
      .map((sp) => {
        const plant = Array.isArray(sp.plants) ? sp.plants[0] : sp.plants;
        return plant?.photo_url ?? null;
      })
      .find((url): url is string => !!url) ?? null;

  return (
    <SchemeResults
      scheme={scheme}
      suggestions={suggestions ?? []}
      heroImage={heroImage}
      shoppingListNoticeSeen={userFlags?.shopping_list_notice_seen_at != null}
    />
  );
}
