import Anthropic from "@anthropic-ai/sdk";
import type { SchemeGenerationResult } from "@/lib/scheme-generation";
import {
  buildSelectionPrompt,
  mergeSelectionResponse,
  type SelectionBrief,
  type SelectionPlant,
} from "@/lib/scheme-selection";

const anthropic = new Anthropic();

/**
 * Writes the narrative and per-plant guidance for a gardener's fixed plant
 * list. Returns the same shape as `generateScheme()` so persistence can be
 * shared, but the suggestions are exactly the input plants — see
 * scheme-selection.ts.
 */
export async function generateSchemeFromSelection(
  plants: SelectionPlant[],
  brief: SelectionBrief
): Promise<SchemeGenerationResult> {
  const prompt = buildSelectionPrompt(plants, brief);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 6000,
    messages: [{ role: "user", content: prompt }],
  });

  console.log(
    `[scheme-selection] tokens: input=${message.usage.input_tokens} output=${message.usage.output_tokens} stop_reason=${message.stop_reason}`
  );

  const rawText = message.content[0].type === "text" ? message.content[0].text.trim() : "";
  const text = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return mergeSelectionResponse(JSON.parse(text), plants);
}
