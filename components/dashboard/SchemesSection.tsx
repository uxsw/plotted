import Link from "next/link";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { SchemeCardScroller } from "@/components/dashboard/SchemeCardScroller";
import type { SchemeSummary } from "@/components/SchemeList";
import buttonStyles from "@/components/ui/Button.module.css";

function ArrowRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

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
        `id, status, name, summary, narrative_intro, created_at,
         scheme_source_plants ( plant_id, plants ( photo_url ) ),
         scheme_suggestions ( saved )`
      )
      .eq("status", "complete")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  if (!plantCount || !schemesData?.length) return null;

  const schemes: SchemeSummary[] = schemesData.map((scheme) => ({
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
    <section aria-label="Planting schemes">
      <h2 className="font-display font-medium text-xl mb-3">Planting schemes</h2>
      <SchemeCardScroller schemes={schemes} />
      <div className="flex items-center justify-between mt-3">
        <Link
          href="/schemes"
          className={clsx(
            buttonStyles["o-button"],
            buttonStyles["o-button--ghost"]
          )}
        >
          View all
          <ArrowRightIcon />
        </Link>
        <Link
          href="/schemes/new"
          className={clsx(
            buttonStyles["o-button"],
            buttonStyles["o-button--primary"]
          )}
        >
          <PlusIcon />
          New scheme
        </Link>
      </div>
    </section>
  );
}
