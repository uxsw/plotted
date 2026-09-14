import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import EntryChoice, { type GardenSummary } from "./_components/EntryChoice";

export const metadata: Metadata = {
  title: "New Planting Scheme | Plotted",
};

/** Garden photos shown on the "From your garden" plate before it says "+N". */
const THUMB_LIMIT = 4;

export default async function PlantSchemeEntryPage() {
  const supabase = await createClient();

  const [countResult, photoResult] = await Promise.all([
    supabase
      .from("plants")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("plants")
      .select("photo_url")
      .eq("status", "active")
      .not("photo_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(THUMB_LIMIT),
  ]);

  /* A failed read falls back to the plate's generic copy (null) rather than
     telling the gardener their garden is empty. */
  const garden: GardenSummary | null =
    countResult.error || countResult.count === null
      ? null
      : {
          count: countResult.count,
          photos: (photoResult.data ?? []).flatMap((p) => (p.photo_url ? [p.photo_url] : [])),
        };

  return <EntryChoice garden={garden} />;
}
