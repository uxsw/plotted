import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchWikimediaImage, type WikimediaImage } from "@/lib/wikimedia";
import SchemeResults from "@/components/SchemeResults";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: scheme } = await supabase.from("schemes").select("name").eq("id", id).single();

  return {
    title: scheme ? `${scheme.name} | Plotted` : "Planting Scheme | Plotted",
  };
}

export default async function SchemeResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: scheme } = await supabase.from("schemes").select("*").eq("id", id).single();
  if (!scheme) notFound();

  const [{ data: sourcePlants }, { data: suggestions }] = await Promise.all([
    supabase
      .from("scheme_source_plants")
      .select("sort_order, plants ( genus, species, cultivar )")
      .eq("scheme_id", id)
      .order("sort_order"),
    supabase
      .from("scheme_suggestions")
      .select("*")
      .eq("scheme_id", id)
      .eq("saved", true)
      .order("sort_order"),
  ]);

  // Hero image: fetch all source plants' Wikimedia images in parallel, then take
  // the first (by sort_order) that resolved — preferring the first source plant
  // but falling back gracefully if it has no usable image.
  const latinNames = (sourcePlants ?? [])
    .map((sp) => {
      const plant = Array.isArray(sp.plants) ? sp.plants[0] : sp.plants;
      if (!plant) return null;
      return [plant.genus, plant.species, plant.cultivar].filter(Boolean).join(" ") || null;
    })
    .filter((name): name is string => !!name);

  const heroCandidates = await Promise.all(latinNames.map((name) => fetchWikimediaImage(name)));
  const heroImage: WikimediaImage | null = heroCandidates.find((img) => img !== null) ?? null;

  return (
    <SchemeResults
      scheme={scheme}
      suggestions={suggestions ?? []}
      heroImage={heroImage}
    />
  );
}
