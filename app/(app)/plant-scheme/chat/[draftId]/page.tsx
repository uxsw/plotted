import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PlantSchemeDraftRecord } from "../../_components/PlantSchemeContext";
import { isStaleGenerating } from "@/lib/scheme-generation-timing";
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
    .select("id, path, phase, state, status, scheme_id")
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

  // A saved draft is finished business: its scheme is the durable artifact.
  if (data.status === "saved" && data.scheme_id) redirect(`/schemes/${data.scheme_id}`);

  // A save may be in flight, or have failed, from before this load (a refresh
  // mid-save). The scheme row — found via schemes.draft_id — is the source of
  // truth; the draft row itself is untouched until a save succeeds.
  const { data: scheme } = await supabase
    .from("schemes")
    .select("id, status, updated_at")
    .eq("draft_id", draftId)
    .maybeSingle();

  if (scheme?.status === "complete") redirect(`/schemes/${scheme.id}`);

  const generation: PlantSchemeDraftRecord["generation"] = scheme
    ? {
        schemeId: scheme.id,
        // A "generating" row nobody has touched in minutes was abandoned.
        status:
          scheme.status === "generating" && !isStaleGenerating(scheme.updated_at)
            ? "generating"
            : "failed",
      }
    : undefined;

  const draft: PlantSchemeDraftRecord = {
    id: data.id,
    path: data.path,
    phase: data.phase,
    state: data.state,
    generation,
  };

  return <DraftChat draft={draft} />;
}
