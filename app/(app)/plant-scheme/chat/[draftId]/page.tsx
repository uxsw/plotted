import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PlantSchemeDraftRecord } from "../../_components/PlantSchemeContext";
import DraftChat from "../../_components/DraftChat";

export const metadata: Metadata = {
  title: "Building your scheme | Plotted",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PlantSchemeDraftPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  // A malformed id is just not-found — don't let it reach Postgres and log as
  // a genuine DB error.
  if (!UUID_RE.test(draftId)) redirect("/plant-scheme");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/plant-scheme");

  const { data, error } = await supabase
    .from("plant_scheme_drafts")
    .select("id, path, phase, state")
    .eq("id", draftId)
    .eq("user_id", user.id)
    .maybeSingle();

  // Not-found and wrong-owner both come back as no row (RLS + the user_id
  // filter); only a real query failure is logged. Same redirect either way.
  if (error) {
    console.error(`[PlantSchemeDraftPage] draft fetch failed for ${draftId}:`, error);
    redirect("/plant-scheme");
  }
  if (!data) redirect("/plant-scheme");

  return <DraftChat draft={data as PlantSchemeDraftRecord} />;
}
