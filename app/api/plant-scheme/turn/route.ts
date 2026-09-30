import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  buildConversationContext,
  ConversationResponseError,
  parseConversationTurn,
  resolveDirectionChoice,
} from "@/lib/scheme-conversation";
import { generateConversationTurn } from "@/lib/scheme-conversation-generation";
import { enforceHourlySchemeTurnLimit, SchemeTurnLimitError } from "@/lib/scheme-conversation-limit";
import type { GardenPlantRow } from "@/lib/scheme-selection";
import type { PersistedDraftState } from "@/app/(app)/plant-scheme/_components/PlantSchemeContext";

// A turn is two blocking model calls (the turn, then its fit check) —
// typically 10–20s, occasionally double that when the check sends it round
// once more — with headroom for the SDK's own retries on 429/5xx. The
// client's TURN_TIMEOUT_MS (requestTurn.ts) sits just above this: keep the
// two in step.
export const maxDuration = 90;

// Generous for any real conversation (the draft state is small JSON); only
// here to bound what a single request can make the server parse and prompt.
const MAX_BODY_BYTES = 256 * 1024;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GARDEN_COLUMNS =
  "id, genus, species, cultivar, common_names, sun_needs, flowering_season_from, flowering_season_to, eventual_height_cm";

/**
 * One assistant turn of the /plant-scheme conversation: the client sends its
 * current draft state and the new turn, and gets back the transcript entries
 * to append. Stateless — nothing is persisted here; the client commits the
 * entries and its own write-through saves them to the draft. The output only
 * ever goes back to the caller, so trusting the caller's own state costs
 * nothing, but it's still validated and capped (buildConversationContext).
 *
 * Body: { state: PersistedDraftState, draftId: string | null, turn: ConversationTurn }
 * 200 { entries: ChatEntry[] } · 400 bad request · 401 · 404 unknown draft ·
 * 409 { error: "draft_saved" } · 413 too large · 429 { error: "rate_limited" } ·
 * 502 { error: "generation_failed" }
 *
 * `draftId` is null only while the conversation has no draft row yet (or its
 * creation failed — the chat carries on unsaved). When present, a draft that's
 * already been saved refuses further turns: its scheme exists and its
 * transcript has been cleared, so e.g. a stale tab left open after saving
 * mustn't keep spending turns on a conversation that can no longer persist.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bodyText = await request.text();
  if (bodyText.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const b = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;

  const turn = parseConversationTurn(b.turn);
  if (!turn) return NextResponse.json({ error: "Invalid turn" }, { status: 400 });
  if (typeof b.state !== "object" || b.state === null) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }
  const state = b.state as Partial<PersistedDraftState>;

  const direction = turn.kind === "direction" ? resolveDirectionChoice(state, turn) : null;
  if (turn.kind === "direction" && !direction) {
    return NextResponse.json({ error: "Unknown direction option" }, { status: 400 });
  }

  if (b.draftId != null) {
    if (typeof b.draftId !== "string" || !UUID_RE.test(b.draftId)) {
      return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
    }
    const { data: draft, error: draftError } = await supabase
      .from("plant_scheme_drafts")
      .select("status")
      .eq("id", b.draftId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (draftError) return NextResponse.json({ error: draftError.message }, { status: 500 });
    if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (draft.status === "saved") {
      return NextResponse.json({ error: "draft_saved" }, { status: 409 });
    }
  }

  // Validation first, so a malformed request never spends the user's allowance.
  try {
    await enforceHourlySchemeTurnLimit(supabase, user.id);
  } catch (err) {
    if (err instanceof SchemeTurnLimitError) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    console.error("[plant-scheme/turn] rate limit check failed:", err);
    return NextResponse.json({ error: "Could not start this turn" }, { status: 500 });
  }

  const gardenIds = (Array.isArray(state.schemePlants) ? state.schemePlants : [])
    .filter((p) => p?.origin === "garden" && typeof p.plantId === "string")
    .map((p) => p.plantId);
  let gardenRows: GardenPlantRow[] = [];
  if (gardenIds.length > 0) {
    // User-scoped, so a garden plant id in the request only resolves to the
    // caller's own record.
    const { data: rows } = await supabase
      .from("plants")
      .select(GARDEN_COLUMNS)
      .in("id", gardenIds)
      .eq("user_id", user.id);
    // Best-effort context: without the rows the model still gets names.
    gardenRows = (rows ?? []) as GardenPlantRow[];
  }

  const ctx = buildConversationContext(state, gardenRows);

  try {
    const { entries } = await generateConversationTurn(
      ctx,
      turn,
      direction,
      (prefix) => `${prefix}-${crypto.randomUUID()}`
    );
    return NextResponse.json({ entries });
  } catch (err) {
    if (err instanceof ConversationResponseError) {
      console.error("[plant-scheme/turn] unusable model response:", err.message);
    } else if (err instanceof Anthropic.APIError) {
      console.error(`[plant-scheme/turn] Anthropic API error ${err.status}:`, err.message);
    } else {
      console.error("[plant-scheme/turn] unexpected failure:", err);
    }
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }
}
