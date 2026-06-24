import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PlantGrid from "@/components/PlantGrid";

export default async function PlantsPage() {
  const supabase = await createClient();
  const { data: plants, error } = await supabase
    .from("plants")
    .select("*")
    .eq("status", "active")
    .order("date_planted", { ascending: false, nullsFirst: false });

  if (error) {
    return (
      <p className="text-sm font-sans text-clay">
        Failed to load plants: {error.message}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-medium text-2xl text-ink">My plants</h1>
        <Link
          href="/plants/new"
          className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium font-sans bg-moss text-white hover:bg-moss-deep transition-colors"
        >
          + Add plant
        </Link>
      </div>
      <PlantGrid plants={plants ?? []} />
    </div>
  );
}
