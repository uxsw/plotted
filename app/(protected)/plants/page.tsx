import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PlantList from "@/components/PlantList";

export default async function PlantsPage() {
  const supabase = await createClient();
  const { data: plants, error } = await supabase
    .from("plants")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-red-600 text-sm">Failed to load plants: {error.message}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Plants</h1>
        <Link
          href="/plants/new"
          className="bg-green-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-800"
        >
          + Add plant
        </Link>
      </div>
      <PlantList plants={plants ?? []} />
    </div>
  );
}
