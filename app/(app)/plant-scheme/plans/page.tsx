import type { Metadata } from "next";
import clsx from "clsx";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SchemeList, { type SchemeSummary } from "@/components/SchemeList";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "All Planting Schemes | Plotted",
};

/**
 * The hub's "View all" destination — every finished plan (and failed
 * attempt), full management (rename, delete, retry). The hub itself
 * (/plant-scheme) only ever previews the three most recent; this is where
 * the rest live. Deliberately its own route rather than a tab or a
 * "show more" on the hub, so it's linkable and keeps the hub itself to one
 * task (see SchemesHub.tsx).
 */
export default async function AllPlansPage() {
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

  const plans: SchemeSummary[] = (data ?? []).map((scheme) => ({
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
    <div className="o-stack">
      <div className="c-plans-page__head">
        <Link href="/plant-scheme" className="o-type-label c-plans-page__back">
          <Icon name="back" size={14} />
          Planting schemes
        </Link>
        <div className="o-row o-row--space-between">
          <h1 className="pica o-type-display kirk">All plans</h1>
          <Link
            href="/plant-scheme"
            className={clsx(buttonStyles["o-button"], buttonStyles["o-button--primary"])}
          >
            <Icon name="add" size={16} />
            New scheme
          </Link>
        </div>
      </div>

      {error ? (
        <p className="brevier c-scheme-hub__error" role="alert">
          Couldn&apos;t load your plans ({error.message}). Try refreshing the page.
        </p>
      ) : plans.length === 0 ? (
        <p className="brevier">
          No plans yet.{" "}
          <Link href="/plant-scheme" className="c-plans-page__link">
            Start your first one
          </Link>
          .
        </p>
      ) : (
        <SchemeList key={plans.map((s) => `${s.id}:${s.status}`).join(",")} schemes={plans} />
      )}
    </div>
  );
}
