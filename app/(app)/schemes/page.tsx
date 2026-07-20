import type { Metadata } from "next";
import clsx from "clsx";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import buttonStyles from "@/components/ui/Button.module.css";
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
      id, status, name, summary, narrative_intro, created_at,
      scheme_source_plants ( plant_id, plants ( photo_url ) ),
      scheme_suggestions ( saved )
    `
    )
    .in("status", ["complete", "failed"])
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
    status: scheme.status as "complete" | "failed",
    name: scheme.name,
    summary: scheme.summary,
    narrative_intro: scheme.narrative_intro,
    created_at: scheme.created_at,
    suggestion_count: scheme.scheme_suggestions.filter((s) => s.saved).length,
    source_plant_photos: scheme.scheme_source_plants
      .flatMap((sp) => sp.plants)
      .map((plant) => plant?.photo_url)
      .filter((url): url is string => !!url),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-3">
        <h1 className="font-display italic text-4xl text-ink">Planting schemes</h1>
        {schemes.length > 0 && (
          <Link
            href="/schemes/new"
            className={clsx(
              buttonStyles["o-button"],
              buttonStyles["o-button--primary"]
            )}
          >
            + Create new scheme
          </Link>
        )}
      </div>
      <SchemeList key={schemes.map((s) => `${s.id}:${s.status}`).join(",")} schemes={schemes} />
    </div>
  );
}
