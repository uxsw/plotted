/**
 * Repeatable quality check for the /plant-scheme conversation engine
 * (lib/scheme-conversation.ts). Runs a fixed set of short conversations
 * against the real model, then scores every reply — so a prompt change is
 * measured against the same run instead of judged by eye.
 *
 *   set -a && . ./.env.local && set +a && npx tsx scripts/eval-scheme-conversation.ts [out.json]
 *
 * Costs real money: roughly 16 engine turns + 4 judge calls per run.
 *
 * Two kinds of check:
 * - Code checks (free, exact): replies over 3 sentences, two plants of one
 *   genus in a reply, a reply calling something "on your list" that isn't,
 *   and latency per turn.
 * - A model judge (claude-opus-5, deliberately stronger than the engine's
 *   model) grades each suggested plant: does it genuinely suit the stated
 *   aspect and soil, are its badges justified, and is its "why this fits"
 *   line backed by something the gardener actually said. Condition fit is
 *   the headline number — it's the product risk.
 *
 * Dev tooling only; nothing in the app imports this.
 */

import { writeFile } from "node:fs/promises";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildConversationContext,
  resolveDirectionChoice,
  type ConversationTurn,
} from "@/lib/scheme-conversation";
import { generateConversationTurn } from "@/lib/scheme-conversation-generation";
import type {
  ChatEntry,
  PersistedDraftState,
  QuestionOutcome,
  SchemePlant,
  SuggestionPlant,
} from "@/app/(app)/plant-scheme/_components/PlantSchemeContext";

const JUDGE_MODEL = "claude-opus-5";
const anthropic = new Anthropic();

type Step =
  | { kind: "initial"; add?: number }
  | { kind: "message"; text: string; add?: number }
  | { kind: "direction"; pick: number };

type Scenario = {
  name: string;
  aspect: string;
  soil: string;
  intent?: string;
  style?: string;
  typed?: string[];
  /** A typed plant that doesn't suit these conditions — the engine should
   *  build around the conditions, not the plant, and say so gently. */
  unsuitedTyped?: string;
  steps: Step[];
};

const SCENARIOS: Scenario[] = [
  {
    name: "shade-clay + lavender",
    aspect: "Partial shade",
    soil: "Heavy clay",
    intent: "Pollinators",
    style: "Cottage / informal",
    typed: ["Lavender"],
    unsuitedTyped: "Lavender",
    steps: [
      { kind: "initial", add: 3 },
      { kind: "message", text: "Could you suggest a few more for late summer colour?" },
      { kind: "message", text: "Will these cope with a very wet winter?" },
    ],
  },
  {
    name: "full sun, free-draining",
    aspect: "Full sun",
    soil: "Free-draining",
    intent: "Year-round colour",
    style: "Low maintenance",
    steps: [
      { kind: "initial", add: 2 },
      { kind: "message", text: "What about something for spring?" },
      { kind: "message", text: "Can you swap the first one on my list for something else?" },
    ],
  },
  {
    name: "full shade, damp + salvia",
    aspect: "Full shade",
    soil: "Stays damp",
    intent: "Wildlife",
    style: "Architectural",
    typed: ["Salvia"],
    unsuitedTyped: "Salvia",
    steps: [
      { kind: "initial", add: 2 },
      { kind: "message", text: "Hmm, none of this really feels right. I want something different." },
      { kind: "direction", pick: 0 },
    ],
  },
  {
    name: "full sun, heavy clay",
    aspect: "Full sun",
    soil: "Heavy clay",
    intent: "Cut flowers",
    steps: [
      { kind: "initial", add: 2 },
      { kind: "message", text: "Could you suggest some really good bee plants?" },
      { kind: "message", text: "Anything with scent for near the path?" },
    ],
  },
];

type TurnRecord = {
  label: string;
  ms: number;
  entries: ChatEntry[];
  replySentences: number | null;
  genusRepeats: string[];
  falseListMentions: string[];
};

function mkId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function sentenceCount(text: string): number {
  return text.split(/(?<=[.!?])\s+/).filter((s) => s.trim()).length;
}

function genusOf(latin: string): string {
  return latin.trim().split(/\s+/)[0].toLowerCase();
}

function suggestionsIn(entries: ChatEntry[]): SuggestionPlant[] {
  return entries.flatMap((e) => (e.kind === "suggestions" ? e.plants : []));
}

/** Plants named in a sentence that also says "your list", but which aren't on it. */
function falseListMentions(reply: string, state: Partial<PersistedDraftState>): string[] {
  const onList = new Set((state.schemePlants ?? []).map((p) => p.commonName.toLowerCase()));
  const shown = (state.transcript ?? [])
    .flatMap((e) => (e.kind === "suggestions" ? e.plants : []))
    .map((p) => p.commonName.toLowerCase());
  const out: string[] = [];
  for (const sentence of reply.split(/(?<=[.!?])\s+/)) {
    if (!/your (scheme )?list/i.test(sentence)) continue;
    for (const name of shown) {
      if (!onList.has(name) && sentence.toLowerCase().includes(name)) out.push(name);
    }
  }
  return Array.from(new Set(out));
}

function toSchemePlant(entryId: string, p: SuggestionPlant): SchemePlant {
  return {
    id: `${entryId}:${p.plantId}`,
    origin: "suggestion",
    sourceEntryId: entryId,
    plantId: p.plantId,
    commonName: p.commonName,
    latinName: p.latinName,
    tier: p.tier,
    note: p.note,
    badges: p.badges,
    months: p.months,
    photoUrl: null,
    addedToShoppingList: false,
  };
}

async function runScenario(sc: Scenario) {
  const outcomes: QuestionOutcome[] = [
    { questionId: "aspect", type: "answered", answer: sc.aspect },
    { questionId: "soil", type: "answered", answer: sc.soil },
    sc.intent
      ? { questionId: "intent", type: "answered", answer: sc.intent }
      : { questionId: "intent", type: "skipped" },
    sc.style
      ? { questionId: "style", type: "answered", answer: sc.style }
      : { questionId: "style", type: "skipped" },
  ];
  const state: Partial<PersistedDraftState> = {
    outcomes,
    freeTextPlants: sc.typed ?? [],
    quickAnswered: false,
    transcript: [],
    schemePlants: [],
  };

  const turns: TurnRecord[] = [];
  for (const step of sc.steps) {
    let turn: ConversationTurn;
    let label: string;
    if (step.kind === "initial") {
      turn = { kind: "initial" };
      label = "initial";
    } else if (step.kind === "message") {
      turn = { kind: "message", text: step.text };
      label = `"${step.text}"`;
    } else {
      const panel = [...state.transcript!].reverse().find((e) => e.kind === "directions");
      if (!panel || panel.kind !== "directions") {
        turns.push({ label: "direction (no panel offered)", ms: 0, entries: [], replySentences: null, genusRepeats: [], falseListMentions: [] });
        continue;
      }
      const option = panel.options[step.pick];
      panel.chosenOptionId = option.id;
      turn = { kind: "direction", directionsEntryId: panel.id, optionId: option.id };
      label = `direction: ${option.label}`;
    }

    const ctx = buildConversationContext(state, []);
    const direction = turn.kind === "direction" ? resolveDirectionChoice(state, turn) : null;
    const start = Date.now();
    const entries = await generateConversationTurn(ctx, turn, direction, mkId);
    const ms = Date.now() - start;

    const reply = entries.find((e) => e.kind === "text" && e.role === "assistant");
    const plants = suggestionsIn(entries);
    const genera = plants.map((p) => genusOf(p.latinName));
    turns.push({
      label,
      ms,
      entries,
      replySentences: reply && reply.kind === "text" ? sentenceCount(reply.text) : null,
      genusRepeats: Array.from(new Set(genera.filter((g, i) => genera.indexOf(g) !== i))),
      falseListMentions: reply && reply.kind === "text" ? falseListMentions(reply.text, state) : [],
    });

    if (turn.kind === "message") state.transcript!.push({ kind: "text", id: mkId("u"), role: "user", text: turn.text });
    state.transcript!.push(...entries);
    const add = "add" in step ? step.add : undefined;
    const card = entries.find((e) => e.kind === "suggestions");
    if (add && card && card.kind === "suggestions") {
      state.schemePlants!.push(...card.plants.slice(0, add).map((p) => toSchemePlant(card.id, p)));
    }
  }
  return { state, turns };
}

// ---- Judge ----------------------------------------------------------------

const JUDGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["plants", "typed_plant_handled"],
  properties: {
    plants: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["latin_name", "sun_fit", "soil_fit", "fit_reason", "invasive_or_restricted", "unjustified_badges", "match_note_ok", "note_consistent"],
        properties: {
          latin_name: { type: "string" },
          sun_fit: { type: "string", enum: ["good", "marginal", "poor"] },
          soil_fit: { type: "string", enum: ["good", "marginal", "poor"] },
          fit_reason: { type: "string" },
          invasive_or_restricted: { type: "boolean" },
          unjustified_badges: { type: "array", items: { type: "string" } },
          match_note_ok: { type: "boolean" },
          note_consistent: { type: "boolean" },
        },
      },
    },
    typed_plant_handled: { type: "string", enum: ["flagged", "built_around_it", "not_applicable", "ignored"] },
  },
} as const;

type JudgedPlant = {
  latin_name: string;
  sun_fit: "good" | "marginal" | "poor";
  soil_fit: "good" | "marginal" | "poor";
  fit_reason: string;
  invasive_or_restricted: boolean;
  unjustified_badges: string[];
  match_note_ok: boolean;
  note_consistent: boolean;
};

async function judge(sc: Scenario, turns: TurnRecord[]) {
  const plantLines = turns.flatMap((t) =>
    suggestionsIn(t.entries).map(
      (p) =>
        `- ${p.latinName} (${p.commonName}) | turn: ${t.label} | badges: ${p.badges.join(", ") || "none"} | flowers: ${p.months.join(",") || "none"} | note: ${p.note} | why this fits: ${p.matchNote ?? "(none)"}`
    )
  );
  const replies = turns.flatMap((t) =>
    t.entries.filter((e) => e.kind === "text").map((e) => `- [${t.label}] ${e.kind === "text" ? e.text : ""}`)
  );
  const said = [
    `Aspect: ${sc.aspect}`,
    `Soil: ${sc.soil}`,
    `Wants: ${sc.intent ?? "(skipped)"}`,
    `Style: ${sc.style ?? "(skipped)"}`,
    sc.typed?.length ? `Plants they mentioned: ${sc.typed.join(", ")}` : null,
    ...sc.steps.flatMap((s) => (s.kind === "message" ? [`They wrote: "${s.text}"`] : [])),
  ].filter(Boolean);

  const prompt = `You are an expert UK horticulturist auditing a gardening app's plant suggestions for a UK garden bed. Be strict and honest — this audit exists to catch plants that won't thrive where they're proposed.

What the gardener told the app:
${said.join("\n")}

Plants the app suggested:
${plantLines.join("\n")}

The app's replies:
${replies.join("\n") || "(none)"}

For each suggested plant:
- sun_fit / soil_fit: would it genuinely thrive in the stated aspect / soil? "good" = a recognised good choice; "marginal" = tolerates it but not ideal; "poor" = a known poor fit (e.g. a Mediterranean sun-lover in shade, a plant that rots in wet clay). If the gardener said "not sure" or skipped, judge leniently.
- fit_reason: one short phrase explaining anything less than good (empty if both good).
- invasive_or_restricted: true if it's on a GB invasive non-native species list, restricted from sale or planting in Great Britain, or a notoriously rampant spreader that would overrun a mixed border.
- unjustified_badges: any of its badges that overstate a real strength of the plant (e.g. "Pollinators" on a plant insects rarely use, "Drought tolerant" on a plant that wants moisture).
- match_note_ok: false if its "why this fits" line claims something the gardener didn't actually say or that isn't true for these conditions (e.g. "just as you described" about something they never described). true if it's accurate, or if there is none.
- note_consistent: false if its note contradicts its own flowering months or what was asked for in that turn (e.g. "midsummer" colour for a late-summer request).

typed_plant_handled: ${sc.unsuitedTyped ? `the gardener mentioned ${sc.unsuitedTyped}, which doesn't suit these conditions. "flagged" if a reply gently points out it won't do well here; "built_around_it" if the suggestions lean on it as if it suits (e.g. companions chosen "to go with" it); "ignored" if neither.` : `"not_applicable".`}`;

  const res = await anthropic.beta.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-06-01"],
    fallbacks: [{ model: "claude-opus-4-8" }],
    messages: [{ role: "user", content: prompt }],
    output_config: { format: { type: "json_schema", schema: JUDGE_SCHEMA } },
  });
  if (res.stop_reason !== "end_turn") throw new Error(`judge stop_reason ${res.stop_reason}`);
  const text = res.content.find((b) => b.type === "text");
  return JSON.parse(text && text.type === "text" ? text.text : "{}") as {
    plants: JudgedPlant[];
    typed_plant_handled: string;
  };
}

// ---- Report ---------------------------------------------------------------

async function main() {
  const outPath = process.argv[2];
  const report: unknown[] = [];
  const totals = { plants: 0, invasive: 0, poorFit: 0, marginalFit: 0, badBadges: 0, badMatchNotes: 0, badNotes: 0, longReplies: 0, replies: 0, genusRepeats: 0, falseList: 0 };
  const latencies: { kind: string; ms: number }[] = [];

  for (const sc of SCENARIOS) {
    const { turns } = await runScenario(sc);
    const verdict = await judge(sc, turns);
    console.log(`\n=== ${sc.name} ===`);
    for (const t of turns) {
      latencies.push({ kind: t.label === "initial" ? "initial" : "follow-up", ms: t.ms });
      const plants = suggestionsIn(t.entries).map((p) => p.latinName).join(", ");
      const dirs = t.entries.find((e) => e.kind === "directions");
      console.log(
        `  ${t.label} (${(t.ms / 1000).toFixed(1)}s)${t.replySentences != null ? ` reply=${t.replySentences}s` : ""}${plants ? ` → ${plants}` : ""}${dirs && dirs.kind === "directions" ? ` → directions: ${dirs.options.map((o) => o.label).join(" | ")}` : ""}`
      );
      if (t.genusRepeats.length) console.log(`    ! same genus in one reply: ${t.genusRepeats.join(", ")}`);
      if (t.falseListMentions.length) console.log(`    ! said on their list but isn't: ${t.falseListMentions.join(", ")}`);
      if (t.replySentences != null) {
        totals.replies += 1;
        if (t.replySentences > 3) totals.longReplies += 1;
      }
      totals.genusRepeats += t.genusRepeats.length;
      totals.falseList += t.falseListMentions.length;
    }
    for (const p of verdict.plants) {
      totals.plants += 1;
      const fits = [p.sun_fit, p.soil_fit];
      if (fits.includes("poor")) totals.poorFit += 1;
      else if (fits.includes("marginal")) totals.marginalFit += 1;
      totals.badBadges += p.unjustified_badges.length;
      if (p.invasive_or_restricted) totals.invasive += 1;
      if (!p.match_note_ok) totals.badMatchNotes += 1;
      if (!p.note_consistent) totals.badNotes += 1;
      const issues = [
        p.invasive_or_restricted ? "INVASIVE/RESTRICTED" : null,
        fits.includes("poor") || fits.includes("marginal") ? `fit sun=${p.sun_fit} soil=${p.soil_fit} (${p.fit_reason})` : null,
        p.unjustified_badges.length ? `badges: ${p.unjustified_badges.join(", ")}` : null,
        !p.match_note_ok ? "why-this-fits unsupported" : null,
        !p.note_consistent ? "note inconsistent" : null,
      ].filter(Boolean);
      if (issues.length) console.log(`    - ${p.latin_name}: ${issues.join("; ")}`);
    }
    if (sc.unsuitedTyped) console.log(`    typed ${sc.unsuitedTyped}: ${verdict.typed_plant_handled}`);
    report.push({ scenario: sc.name, turns, verdict });
  }

  const avg = (kind: string) => {
    const xs = latencies.filter((l) => l.kind === kind).map((l) => l.ms);
    return xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length / 1000).toFixed(1) : "-";
  };
  console.log(`\n=== Summary ===`);
  console.log(`Invasive/restricted: ${totals.invasive} of ${totals.plants} plants`);
  console.log(`Condition fit:   ${totals.poorFit} poor, ${totals.marginalFit} marginal, of ${totals.plants} plants`);
  console.log(`Badges:          ${totals.badBadges} unjustified`);
  console.log(`Why-this-fits:   ${totals.badMatchNotes} unsupported`);
  console.log(`Notes:           ${totals.badNotes} inconsistent`);
  console.log(`Replies:         ${totals.longReplies} of ${totals.replies} over 3 sentences`);
  console.log(`Genus repeats:   ${totals.genusRepeats}`);
  console.log(`False "on your list": ${totals.falseList}`);
  console.log(`Latency:         initial avg ${avg("initial")}s, follow-up avg ${avg("follow-up")}s`);

  if (outPath) {
    await writeFile(outPath, JSON.stringify({ totals, latencies, report }, null, 2));
    console.log(`\nWrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
