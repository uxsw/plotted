import Anthropic from "@anthropic-ai/sdk";
import type { ChatEntry, DirectionOption } from "@/app/(app)/plant-scheme/_components/PlantSchemeContext";
import {
  buildConversationPrompt,
  CONVERSATION_RESPONSE_SCHEMA,
  CONVERSATION_SYSTEM_PROMPT,
  ConversationResponseError,
  mergeConversationResponse,
  suggestedLatinNames,
  type ConversationContext,
  type ConversationTurn,
} from "@/lib/scheme-conversation";

const anthropic = new Anthropic();

/**
 * One assistant turn of the /plant-scheme conversation. Returns the transcript
 * entries to append — see scheme-conversation.ts for what goes in and the
 * shape rules on what comes out.
 *
 * Same model as the app's other generation call sites. Structured outputs
 * (`output_config.format`) guarantee parseable JSON against a hand-written
 * schema; mergeConversationResponse still validates by hand.
 */
export async function generateConversationTurn(
  ctx: ConversationContext,
  turn: ConversationTurn,
  direction: { chosen: DirectionOption; others: DirectionOption[] } | null,
  mkId: (prefix: string) => string
): Promise<ChatEntry[]> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
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
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ConversationResponseError("Response was not valid JSON");
  }

  const entries = mergeConversationResponse(raw, ctx, turn, mkId);

  // Convergence check on real traffic: which plants the model reaches for.
  const names = suggestedLatinNames(entries);
  if (names.length > 0) console.log(`[scheme-conversation] suggested: ${names.join(" | ")}`);

  return entries;
}
