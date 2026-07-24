import Link from "next/link";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import type { Plant } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { GardenCardScroller } from "@/components/dashboard/GardenCardScroller";
import buttonStyles from "@/components/ui/Button.module.css";

function ArrowRightIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
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
    <section aria-label="Your garden" className="hero-card--empty">
      {plants.length === 0 ? (
        <EmptyState
          heading="No plants yet"
          body="Start building your garden portfolio."
          action={
            <Link
              href="/plants/new"
              className={clsx(
                buttonStyles["o-button"],
                buttonStyles["o-button--primary"]
              )}
            >
              <PlusIcon />
              Add plant
            </Link>
          }
        />
      ) : (
        <>
          <GardenCardScroller plants={plants} />
          <div className="flex items-center justify-between mt-3">
            <Link
              href="/plants"
              className={clsx(
                buttonStyles["o-button"],
                buttonStyles["o-button--ghost"]
              )}
            >
              View all
              <ArrowRightIcon />
            </Link>
            <Link
              href="/plants/new"
              className={clsx(
                buttonStyles["o-button"],
                buttonStyles["o-button--primary"]
              )}
            >
              <PlusIcon />
              Add plant
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
