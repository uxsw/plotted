/**
 * The client side of one conversation turn against /api/plant-scheme/turn.
 * Shared by ChatPane.tsx (message and direction turns) and
 * PlantSchemeContext.tsx (the initial turn, which has to outlive ChatPane —
 * see initialTurnStatus there).
 */

import type { ChatEntry, PersistedDraftState } from "./PlantSchemeContext";
import type { ConversationTurn } from "@/lib/scheme-conversation";

/**
 * A real turn is one blocking model call — typically 5–15s. Past this the
 * request is abandoned and the turn lands in its failed state, since a hung
 * fetch would otherwise leave the chat locked with no way out. Comfortably
 * above the route's worst case short of the host's own timeout
 * (maxDuration = 60 in app/api/plant-scheme/turn/route.ts).
 */
export const TURN_TIMEOUT_MS = 45_000;

/** A turn that didn't go through. `status` is the HTTP status when the server
 *  answered (429 = the hourly turn limit), null for a timeout, network drop
 *  or malformed body. */
export class TurnRequestError extends Error {
  constructor(
    message: string,
    readonly status: number | null
  ) {
    super(message);
  }
}

export function isRateLimited(err: unknown): boolean {
  return err instanceof TurnRequestError && err.status === 429;
}

/**
 * One conversation turn against the real engine. `state` is the draft as it
 * stands right now (the route is stateless — it builds the model's context
 * from what's sent); `draftId` lets it refuse a turn on an already-saved
 * draft. Rejects with a TurnRequestError on any non-2xx, a malformed body,
 * or TURN_TIMEOUT_MS elapsing.
 */
export async function requestTurn(
  state: PersistedDraftState,
  draftId: string | null,
  turn: ConversationTurn
): Promise<ChatEntry[]> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TURN_TIMEOUT_MS);
  try {
    let res: Response;
    try {
      res = await fetch("/api/plant-scheme/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, draftId, turn }),
        signal: controller.signal,
      });
    } catch (err) {
      throw new TurnRequestError(`turn failed: ${String(err)}`, null);
    }
    if (!res.ok) throw new TurnRequestError(`turn failed: ${res.status}`, res.status);
    const json: unknown = await res.json().catch(() => null);
    const entries = (json as { entries?: unknown } | null)?.entries;
    if (!Array.isArray(entries)) throw new TurnRequestError("turn failed: malformed response", null);
    return entries as ChatEntry[];
  } finally {
    window.clearTimeout(timer);
  }
}
