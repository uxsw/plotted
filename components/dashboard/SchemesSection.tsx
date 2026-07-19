import { createClient } from "@/lib/supabase/server";
import SchemeList, { type SchemeSummary } from "@/components/SchemeList";

export default async function SchemesSection() {
  const supabase = await createClient();

  const [{ count: plantCount }, { data: schemesData }] = await Promise.all([
    supabase
      .from("plants")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("schemes")
      .select(
        `id, status, name, summary, created_at,
         scheme_source_plants ( plant_id, plants ( photo_url ) ),
         scheme_suggestions ( saved )`
      )
      .in("status", ["complete", "failed"])
      .order("created_at", { ascending: false }),
  ]);

  if (!plantCount || !schemesData?.length) return null;

  const schemes: SchemeSummary[] = schemesData.map((scheme) => ({
    id: scheme.id,
    status: scheme.status as "complete" | "failed",
    name: scheme.name,
    summary: scheme.summary,
    created_at: scheme.created_at,
    suggestion_count: scheme.scheme_suggestions.filter((s) => s.saved).length,
    source_plant_photos: scheme.scheme_source_plants
      .flatMap((sp) => sp.plants)
      .map((plant) => plant?.photo_url)
      .filter((url): url is string => !!url),
  }));

  return (
    <section aria-label="Planting schemes">
      <h2 className="font-display font-medium text-xl text-ink mb-3">Planting schemes</h2>
      <SchemeList schemes={schemes} />
    </section>
  );
}
