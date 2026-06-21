"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Plant } from "@/lib/types";
import { plantDisplayTitle, ScientificName } from "@/lib/plantName";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

type SortKey = "date" | "name";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatSeason(from: number, to: number): string {
  return `${MONTH_ABBR[from - 1]}–${MONTH_ABBR[to - 1]}`;
}

function sortPlants(plants: Plant[], by: SortKey): Plant[] {
  return [...plants].sort((a, b) => {
    if (by === "name") {
      return plantDisplayTitle(a).localeCompare(plantDisplayTitle(b));
    }
    // date: newest first; nulls last
    if (!a.date_planted && !b.date_planted) return 0;
    if (!a.date_planted) return 1;
    if (!b.date_planted) return -1;
    return b.date_planted.localeCompare(a.date_planted);
  });
}

export default function PlantGrid({ plants }: { plants: Plant[] }) {
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const router = useRouter();

  const sorted = useMemo(() => sortPlants(plants, sortBy), [plants, sortBy]);

  if (plants.length === 0) {
    return (
      <EmptyState
        illustration={<GardenIllustration />}
        heading="Nothing planted yet"
        body="Add your first plant to start building your garden portfolio."
        action={
          <Button variant="primary" onClick={() => router.push("/plants/new")}>
            Add a plant
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Sort toggle */}
      <div className="flex items-center gap-1 self-end">
        <span className="text-xs font-sans text-ink-soft mr-2">Sort by</span>
        <div className="flex rounded border border-sand-line overflow-hidden">
          <button
            onClick={() => setSortBy("date")}
            className={[
              "px-3 py-1.5 text-xs font-sans font-medium transition-colors",
              sortBy === "date"
                ? "bg-moss text-white"
                : "bg-paper text-ink-soft hover:bg-sand",
            ].join(" ")}
          >
            Date planted
          </button>
          <button
            onClick={() => setSortBy("name")}
            className={[
              "px-3 py-1.5 text-xs font-sans font-medium transition-colors border-l border-sand-line",
              sortBy === "name"
                ? "bg-moss text-white"
                : "bg-paper text-ink-soft hover:bg-sand",
            ].join(" ")}
          >
            Name
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {sorted.map((plant) => {
          const title = plantDisplayTitle(plant);
          const hasCommonName = !!plant.common_name;
          const hasSeason =
            plant.flowering_season_from !== null &&
            plant.flowering_season_to !== null;

          return (
            <Card
              key={plant.id}
              photoUrl={plant.photo_url}
              photoAlt={title}
              title={title}
              subtitle={
                hasCommonName ? (
                  <ScientificName
                    genus={plant.genus}
                    species={plant.species}
                    cultivar={plant.cultivar}
                  />
                ) : undefined
              }
              tags={
                <>
                  {hasSeason && (
                    <Tag color="season">
                      {formatSeason(
                        plant.flowering_season_from!,
                        plant.flowering_season_to!
                      )}
                    </Tag>
                  )}
                  {plant.sun_needs && (
                    <Tag color="sun">{plant.sun_needs}</Tag>
                  )}
                </>
              }
              onClick={() => router.push(`/plants/${plant.id}`)}
            />
          );
        })}
      </div>
    </div>
  );
}

function GardenIllustration() {
  return (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path
        d="M48 80V44M48 44C48 44 38 36 30 24M48 44C48 44 58 36 66 24M48 44C48 44 42 52 38 62M48 44C48 44 54 52 58 62"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 80h40"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
