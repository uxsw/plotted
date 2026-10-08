import Anthropic from "@anthropic-ai/sdk";

// One client for the shopping list lookup's two calls. The SDK defaults (ten
// minute timeout, two retries) let a single stalled call hold a background
// lookup open for over a minute; these keep each call to roughly 41s at the
// very worst (20s + backoff + 20s), and the lookup's own budget
// (LOOKUP_BUDGET_MS in lookup.ts) cuts in before that.
export const lookupAnthropic = new Anthropic({ timeout: 20_000, maxRetries: 1 });

export const SHOPPING_LOOKUP_MODEL = "claude-sonnet-4-6";

export type ModelUsage = {
  /** Every input token, including those read from or written to the prompt cache. */
  input_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  output_tokens: number;
  ms: number;
};

export function usageFrom(message: Anthropic.Message, started: number): ModelUsage {
  const read = message.usage.cache_read_input_tokens ?? 0;
  const write = message.usage.cache_creation_input_tokens ?? 0;
  return {
    input_tokens: message.usage.input_tokens + read + write,
    cache_read_tokens: read,
    cache_write_tokens: write,
    output_tokens: message.usage.output_tokens,
    ms: Date.now() - started,
  };
}
