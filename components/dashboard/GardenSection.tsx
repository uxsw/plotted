import Link from "next/link";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import type { Plant } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { GardenCardScroller } from "@/components/dashboard/GardenCardScroller";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";

export default async function GardenSection() {
  const supabase = await createClient();
  // "Lately in your garden" — ordered by last touch (the plants_updated_at
  // trigger bumps updated_at on any edit, including a new photo), so recently
  // added *and* recently changed plants surface here, not just the newest.
  const { data } = await supabase
    .from("plants")
    .select("id, genus, species, cultivar, common_names, photo_url, sun_needs, identification_status")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(6);

  const plants = (data ?? []) as Pick<
    Plant,
    "id" | "genus" | "species" | "cultivar" | "common_names" | "photo_url" | "sun_needs" | "identification_status"
  >[];

  return (
    <section aria-label="Lately in your garden">
      {plants.length === 0 ? (
        <div className="hero-card--empty">
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
                <Icon name="add" size={16} />
                Add plant
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <GardenCardScroller plants={plants} />
          <div className="flex items-center justify-between mt-3">
            <Link
              href="/plants"
              className={clsx(
                buttonStyles["o-button"],
                buttonStyles["o-button--ghost"],
                buttonStyles["o-button--flush-start"],
              )}
            >
              View all
              <Icon name="right" size={16} />
            </Link>
            <Link
              href="/plants/new"
              className={clsx(
                buttonStyles["o-button"],
                buttonStyles["o-button--primary"]
              )}
            >
              <Icon name="add" size={16} />
              Add plant
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
