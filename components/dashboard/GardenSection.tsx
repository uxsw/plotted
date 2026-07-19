import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Plant } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { PlaceholderPlantCard } from "@/components/ui/PlaceholderPlantCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlantName } from "@/components/plants/PlantName";
import { SunBadge } from "@/components/ui/SunBadge";

function HeroPlantCard({ plant }: { plant: Plant }) {
  return (
    <div className="w-52 shrink-0">
      <Card
        photoUrl={plant.photo_url}
        photoAlt={plant.species ?? undefined}
        title={<PlantName species={plant.species} cultivar={plant.cultivar} variant="card" />}
        subtitle={plant.common_names?.[0]}
        sunBadge={plant.sun_needs ? <SunBadge value={plant.sun_needs} /> : undefined}
        href={`/plants/${plant.id}`}
        priority
      />
    </div>
  );
}

function SmallPlantCard({ plant }: { plant: Plant }) {
  return (
    <div className="w-36 shrink-0">
      <Card
        photoUrl={plant.photo_url}
        photoAlt={plant.species ?? undefined}
        title={<PlantName species={plant.species} cultivar={plant.cultivar} variant="card" />}
        subtitle={plant.common_names?.[0]}
        href={`/plants/${plant.id}`}
      />
    </div>
  );
}

export default async function GardenSection() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plants")
    .select("id, species, cultivar, common_names, photo_url, sun_needs")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);

  const plants = (data ?? []) as Pick<
    Plant,
    "id" | "species" | "cultivar" | "common_names" | "photo_url" | "sun_needs"
  >[];

  return (
    <section aria-label="Your garden">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-medium text-xl text-ink">Your garden</h2>
        <Link
          href="/plants"
          className="font-sans text-sm text-moss hover:text-moss-deep transition-colors"
        >
          View all
        </Link>
      </div>

      {plants.length === 0 ? (
        <EmptyState
          heading="No plants yet"
          body="Start building your garden portfolio."
          action={
            <Link
              href="/plants/new"
              className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium font-sans bg-moss text-white hover:bg-moss-deep transition-colors"
            >
              + Add plant
            </Link>
          }
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          <HeroPlantCard plant={plants[0] as Plant} />
          {plants.slice(1).map((plant) => (
            <SmallPlantCard key={plant.id} plant={plant as Plant} />
          ))}
          {plants.length < 6 && (
            <div className="w-36 shrink-0">
              <PlaceholderPlantCard opacity={0.4} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
