import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: plant } = await supabase
    .from("plants")
    .select("genus, species, cultivar")
    .eq("id", id)
    .eq("status", "active")
    .single();

  const displayName = [plant?.genus, plant?.species, plant?.cultivar].filter(Boolean).join(" ") || null;

  return {
    title: displayName ? `${displayName} | Plotted` : "Plant | Plotted",
  };
}
import PlantDetail from "@/components/PlantDetail";
import { computeSpeciesMatchKey } from "@/lib/species-match-key";
import { PENDING_STALE_MS } from "@/lib/species-reference-timing";
import type { SpeciesRef } from "@/lib/types";

export default async function PlantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: plant }] = await Promise.all([
    supabase.from("plants").select("*").eq("id", id).eq("status", "active").single(),
    supabase.auth.getUser(),
  ]);

  if (!plant) notFound();

  const matchKey = computeSpeciesMatchKey(plant.genus, plant.species, plant.cultivar);
  const { data: speciesRefRow } = await supabase
    .from("species_reference")
    .select("id, lookup_status, frost_tolerance_c, frost_tolerance_notice")
    .eq("match_key", matchKey)
    .maybeSingle();

  const speciesRef = speciesRefRow as SpeciesRef | null;

  // Computed here, not in PlantDetail (a client component), so PlantDetail's
  // render body never needs to call Date.now() itself — that's flagged as
  // impure by React Compiler's purity lint, and would only get worse once
  // that render is behind a polling loop. Suppressed here rather than
  // avoided: this route is already fully dynamic per-request (auth cookies
  // above force that), not statically prerendered or otherwise cached, so
  // "impure = stale/wrong under caching" doesn't apply — every request,
  // including each of PlantDetail's polling-driven router.refresh() calls,
  // re-runs this against the real current time.
  // eslint-disable-next-line react-hooks/purity -- see comment above
  const recentlyAdded = Date.now() - new Date(plant.created_at).getTime() < PENDING_STALE_MS;

  return <PlantDetail plant={plant} speciesRef={speciesRef} recentlyAdded={recentlyAdded} />;
}
