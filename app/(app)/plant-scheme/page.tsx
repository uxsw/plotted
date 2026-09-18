import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { SchemeSummary } from "@/components/SchemeList";
import { needsSchemeOnboarding } from "@/lib/scheme-onboarding";
import SchemesHub from "./_components/SchemesHub";
import { MOCK_DRAFTS } from "./_components/mockDrafts";

export const metadata: Metadata = {
  title: "Planting Schemes | Plotted",
};

/**
 * The planting schemes hub — start a scheme, carry on with a draft, reopen a
 * finished plan, all on one page. Replaces the old A/B entry and both picker
 * steps (/existing and /scratch now redirect here).
 *
 * A genuinely first-time gardener (see needsSchemeOnboarding) sees the same
 * hub with a one-time welcome dialog over it, rather than a separate page —
 * the real page is already there underneath once they dismiss it.
 *
 * Preview params (drafts are mocked until conversations are saved):
 *   ?drafts=0    hide the mock drafts
 *   ?plans=0     hide finished plans (with ?drafts=0: the brand-new gardener)
 *   ?garden=0    pretend the garden has no plants
 *   ?welcome=1   force the welcome dialog open (preview only — not marked seen)
 *   ?welcome=0   force it closed, whatever the real gate says
 */
export default async function PlantSchemeHubPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const showWelcome =
    params.welcome === "0"
      ? false
      : params.welcome === "1"
        ? true
        : await needsSchemeOnboarding();

  const supabase = await createClient();

  const [plantsResult, schemesResult] = await Promise.all([
    supabase
      .from("plants")
      .select("id, photo_url, genus, species, cultivar, common_names")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("schemes")
      .select(
        `
        id, status, name, summary, narrative_intro, created_at,
        scheme_source_plants ( plant_id, plants ( photo_url ) ),
        scheme_suggestions ( saved )
      `
      )
      .in("status", ["complete", "failed"])
      .order("created_at", { ascending: false }),
  ]);

  /* A failed garden read is not an empty garden: null lets the start panel
     say so, and typing names still works. */
  const plants =
    params.garden === "0" ? [] : plantsResult.error ? null : (plantsResult.data ?? []);

  const plans: SchemeSummary[] =
    params.plans === "0"
      ? []
      : (schemesResult.data ?? []).map((scheme) => ({
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
    <SchemesHub
      plants={plants}
      drafts={params.drafts === "0" ? [] : MOCK_DRAFTS}
      plans={plans}
      plansError={params.plans === "0" ? null : (schemesResult.error?.message ?? null)}
      showWelcome={showWelcome}
      welcomeIsPreview={params.welcome === "1"}
    />
  );
}
