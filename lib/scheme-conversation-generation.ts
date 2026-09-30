import Anthropic from "@anthropic-ai/sdk";
import type { ChatEntry, DirectionOption } from "@/app/(app)/plant-scheme/_components/PlantSchemeContext";
import {
  applyFitCheck,
  buildConversationPrompt,
  buildFitCheckPrompt,
  CONVERSATION_RESPONSE_SCHEMA,
  CONVERSATION_SYSTEM_PROMPT,
  ConversationResponseError,
  FIT_CHECK_SCHEMA,
  FIT_CHECK_SYSTEM_PROMPT,
  mergeConversationResponse,
  parseFitCheck,
  proposedPlants,
  speciesKey,
  suggestedLatinNames,
  type ConversationContext,
  type ConversationTurn,
  type FitVerdict,
} from "@/lib/scheme-conversation";

const anthropic = new Anthropic();

const MODEL = "claude-sonnet-4-6";

/** A starting scheme thinner than this after the fit check is regenerated
 *  once (with the rejected plants ruled out) rather than shown as-is. */
const MIN_INITIAL_PLANTS = 4;

type Direction = { chosen: DirectionOption; others: DirectionOption[] } | null;
type Dropped = { commonName: string; latinName: string; reason: string };

export type ConversationTurnResult = {
  /** The transcript entries to append. */
  entries: ChatEntry[];
  /** What the fit check did — for logging and scripts/eval-scheme-conversation.ts. */
  fitCheck: { checked: number; dropped: Dropped[]; regenerated: boolean };
};

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new ConversationResponseError("Response was not valid JSON");
  }
}

/** The generating call: the model proposes the turn. */
async function proposeTurn(
  ctx: ConversationContext,
  turn: ConversationTurn,
  direction: Direction,
  mkId: (prefix: string) => string
): Promise<ChatEntry[]> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: CONVERSATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildConversationPrompt(ctx, turn, direction) }],
    output_config: { format: { type: "json_schema", schema: CONVERSATION_RESPONSE_SCHEMA } },
  });

  console.log(
    `[scheme-conversation] turn=${turn.kind} tokens: input=${message.usage.input_tokens} output=${message.usage.output_tokens} stop_reason=${message.stop_reason}`
  );

  // A truncated or refused response may not match the schema.
  if (message.stop_reason !== "end_turn") {
    throw new ConversationResponseError(`Unusable stop_reason: ${message.stop_reason}`);
  }

  const text = message.content.find((b) => b.type === "text")?.text ?? "";
  return mergeConversationResponse(parseJson(text), ctx, turn, mkId);
}

/** The fit check: an independent pass over the proposed plants. Throws if the
 *  check itself can't run — the turn then fails and can be retried, rather
 *  than showing plants nobody checked. */
async function checkFit(
  ctx: ConversationContext,
  plants: { commonName: string; latinName: string }[]
): Promise<FitVerdict[]> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: FIT_CHECK_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildFitCheckPrompt(ctx, plants) }],
    output_config: { format: { type: "json_schema", schema: FIT_CHECK_SCHEMA } },
  });

  console.log(
    `[scheme-conversation] fit-check tokens: input=${message.usage.input_tokens} output=${message.usage.output_tokens} stop_reason=${message.stop_reason}`
  );

  if (message.stop_reason !== "end_turn") {
    throw new ConversationResponseError(`Fit check unusable stop_reason: ${message.stop_reason}`);
  }
  const text = message.content.find((b) => b.type === "text")?.text ?? "";
  return parseFitCheck(parseJson(text), plants.length);
}

/** Propose, then check. Turns with no plants (text, directions) skip the check. */
async function checkedAttempt(
  ctx: ConversationContext,
  turn: ConversationTurn,
  direction: Direction,
  mkId: (prefix: string) => string
) {
  const proposed = await proposeTurn(ctx, turn, direction, mkId);
  const plants = proposedPlants(proposed);
  if (plants.length === 0) return { entries: proposed, dropped: [], kept: 0, emptied: false, checked: 0 };
  const verdicts = await checkFit(ctx, plants);
  return { ...applyFitCheck(proposed, verdicts), checked: plants.length };
}

/**
 * One assistant turn of the /plant-scheme conversation — see
 * scheme-conversation.ts for what goes in and the shape rules on what comes
 * out.
 *
 * Two calls, same model as the app's other generation call sites: the turn
 * itself, then the fit check over any plants it proposed (see "Fit check" in
 * scheme-conversation.ts). If the check leaves a card empty — or a starting
 * scheme thinner than MIN_INITIAL_PLANTS — the turn is generated once more
 * with the rejected plants ruled out, and the better of the two attempts is
 * used. Still empty after that, the turn fails (retryable) rather than
 * showing a reply that promises plants with no cards under it.
 *
 * Structured outputs (`output_config.format`) guarantee parseable JSON
 * against hand-written schemas; the merge and parse steps still validate by
 * hand.
 */
export async function generateConversationTurn(
  ctx: ConversationContext,
  turn: ConversationTurn,
  direction: Direction,
  mkId: (prefix: string) => string
): Promise<ConversationTurnResult> {
  let best = await checkedAttempt(ctx, turn, direction, mkId);
  let checked = best.checked;
  const dropped: Dropped[] = [...best.dropped];
  let regenerated = false;

  const tooThin = (a: typeof best) =>
    a.emptied || (turn.kind === "initial" && a.kept < MIN_INITIAL_PLANTS);

  if (tooThin(best)) {
    regenerated = true;
    const retryCtx: ConversationContext = {
      ...ctx,
      unsuited: [...(ctx.unsuited ?? []), ...dropped],
      avoidKeys: new Set([...ctx.avoidKeys, ...dropped.map((d) => speciesKey(d.latinName))]),
    };
    const second = await checkedAttempt(retryCtx, turn, direction, mkId);
    checked += second.checked;
    dropped.push(...second.dropped);
    // Better = more plants survived; or a usable turn at all (e.g. the retry
    // answered in words instead) over an emptied one.
    if (second.kept > best.kept || (best.emptied && !second.emptied)) best = second;
  }

  if (best.emptied) {
    throw new ConversationResponseError("No suggested plants passed the fit check");
  }

  if (dropped.length > 0) {
    console.log(
      `[scheme-conversation] fit check dropped: ${dropped.map((d) => `${d.latinName} (${d.reason})`).join(" | ")}${regenerated ? " — regenerated once" : ""}`
    );
  }
  // Convergence check on real traffic: which plants the model reaches for.
  const names = suggestedLatinNames(best.entries);
  if (names.length > 0) console.log(`[scheme-conversation] suggested: ${names.join(" | ")}`);

  return { entries: best.entries, fitCheck: { checked, dropped, regenerated } };
}
