import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Garden | Plotted",
};
import { createClient } from "@/lib/supabase/server";
import PlantGrid from "@/components/PlantGrid";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PwaInstallTriggerCard } from "@/components/ui/PwaInstallTriggerCard";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";

export default async function PlantsPage() {
  const supabase = await createClient();
  const [{ data: plants, error }, { data: flags }] = await Promise.all([
    supabase
      .from("plants")
      .select("*")
      .eq("status", "active")
      .order("date_planted", { ascending: false, nullsFirst: false }),
    supabase
      .from("user_flags")
      .select("pwa_prompt_dismiss_count, pwa_installed_at")
      .maybeSingle(),
  ]);

  if (error) {
    return (
      <p className="text-sm font-sans text-clay">
        Failed to load plants: {error.message}
      </p>
    );
  }

  const plantCount = (plants ?? []).length;

  return (
    <div className="o-stack">
      <div className="o-row space-between">
        <h1 className="pica o-type-display kirk">My plants</h1>
        {plantCount > 0 && (
          <Link
            href="/plants/new"
            className={[buttonStyles["o-button"], buttonStyles["o-button--primary"]].join(" ")}
          >
            <Icon name="add" aria-label="Add plant" /> Add plant
          </Link>
        )}
      </div>
      <PwaInstallTriggerCard
        initialDismissCount={flags?.pwa_prompt_dismiss_count ?? 0}
        initialInstalledAt={flags?.pwa_installed_at ?? null}
        plantCount={plantCount}
      />
      <ErrorBoundary>
        <PlantGrid plants={plants ?? []} />
      </ErrorBoundary>
    </div>
  );
}
