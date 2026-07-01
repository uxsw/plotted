import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SchemeList, { type SchemeSummary } from "@/components/SchemeList";

export const metadata: Metadata = {
  title: "Planting Schemes | Plotted",
};

export default async function SchemesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schemes")
    .select(
      `
      id, name, created_at,
      scheme_source_plants ( plant_id, plants ( photo_url ) ),
      scheme_suggestions ( saved )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="text-sm font-sans text-clay">
        Failed to load planting schemes: {error.message}
      </p>
    );
  }

  const schemes: SchemeSummary[] = (data ?? []).map((scheme) => ({
    id: scheme.id,
    name: scheme.name,
    created_at: scheme.created_at,
    suggestion_count: scheme.scheme_suggestions.filter((s) => s.saved).length,
    source_plant_photos: scheme.scheme_source_plants
      .flatMap((sp) => sp.plants)
      .map((plant) => plant?.photo_url)
      .filter((url): url is string => !!url),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-medium text-2xl text-ink">Planting schemes</h1>
        {schemes.length > 0 && (
          <Link
            href="/schemes/new"
            className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium font-sans bg-moss text-white hover:bg-moss-deep transition-colors"
          >
            + Create new scheme
          </Link>
        )}
      </div>
      <SchemeList schemes={schemes} />
    </div>
  );
}
