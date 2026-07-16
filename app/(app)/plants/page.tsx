import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Garden | Plotted",
};
import { createClient } from "@/lib/supabase/server";
import PlantGrid from "@/components/PlantGrid";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PwaInstallTriggerCard } from "@/components/ui/PwaInstallTriggerCard";

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
      .select("pwa_prompt_dismiss_count, pwa_installed_at, onboarding_location_seen_at")
      .maybeSingle(),
  ]);

  if (!flags?.onboarding_location_seen_at) {
    redirect("/onboarding/location");
  }

  if (error) {
    return (
      <p className="text-sm font-sans text-clay">
        Failed to load plants: {error.message}
      </p>
    );
  }

  const plantCount = (plants ?? []).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-medium text-2xl text-ink">My plants</h1>
        {plantCount > 0 && (
          <Link
            href="/plants/new"
            className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium font-sans bg-moss text-white hover:bg-moss-deep transition-colors"
          >
            + Add plant
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
