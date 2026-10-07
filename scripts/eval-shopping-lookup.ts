/**
 * Repeatable check of the shopping list name lookup
 * (lib/shopping-lookup/): resolve → verify on Wikipedia → summarise, run
 * against the real model over a fixed fixture, so a prompt or rule change is
 * measured against the same inputs instead of judged by eye.
 *
 *   set -a && . ./.env.local && set +a && npx tsx scripts/eval-shopping-lookup.ts [out.json] [--only=category,…]
 *
 * Costs real money, though not much: one small resolver call per run (about
 * 75 runs), plus one summary call for each input that resolves confidently.
 * Also makes roughly 100 Wikipedia summary requests.
 *
 * What it checks:
 * - Where the expected plant landed: top candidate, among the three, missing.
 * - Phonetic and real-dictation inputs run twice; disagreement on the top
 *   candidate or the final confidence is flagged.
 * - Traps (fake species, fake cultivar, fake plant) and junk/injection
 *   inputs must never come out as a confident match.
 * - "priors" inputs run with and without known_plants: priors may nudge,
 *   never override.
 * - Latency and token counts per run.
 *
 * Dev tooling only; nothing in the app imports this. No database access.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { lookupPlantByName, type LookupOutcome, type LookupTrace, type VerifiedCandidate } from "@/lib/shopping-lookup/lookup";

type Expected = { genus: string; species?: string; cultivar?: string; also_accept?: string[] };

type FixtureEntry = {
  id: string;
  input: string;
  category: string;
  expected?: Expected;
  notes?: string;
  /** Pass only if the outcome is "none" or "low". */
  expect_none?: boolean;
  /** Pass only if nothing is confidently resolved. */
  must_not_be_high?: boolean;
  /** For the fake-cultivar trap: the cultivar that must not be resolved. */
  trap_cultivar?: string;
  known_plants?: string[];
};

type Run = {
  id: string;
  input: string;
  category: string;
  label: string;
  known_plants: string[];
  outcome: LookupOutcome | { kind: "error"; message: string };
  trace: LookupTrace | null;
  expected_position: "top" | "in-three" | "missing" | null;
  final_confidence: string;
  check: "pass" | "FAIL" | "warn" | "-";
  check_note: string;
  total_ms: number;
};

const REPEAT_CATEGORIES = new Set(["phonetic", "real-dictation"]);
const CONCURRENCY = 3;

const fold = (s: string) => s.toLowerCase().replace(/ph/g, "f").replace(/[×\s]/g, "");

function matchesExpected(c: VerifiedCandidate, expected: Expected): boolean {
  if (c.genus.toLowerCase() !== expected.genus.toLowerCase()) return false;
  if (expected.species) {
    const accepted = [expected.species, ...(expected.also_accept ?? [])].map(fold);
    // A cultivar attached straight to the genus is fine when a cultivar was expected.
    if (c.species ? !accepted.includes(fold(c.species)) : !expected.cultivar) return false;
  }
  if (expected.cultivar && fold(c.cultivar ?? "") !== fold(expected.cultivar)) return false;
  return true;
}

function nameOf(c: VerifiedCandidate): string {
  return [c.genus, c.species, c.cultivar ? `'${c.cultivar}'` : null].filter(Boolean).join(" ");
}

function topOf(run: Run): string {
  const top = run.trace?.candidates[0];
  return top ? nameOf(top) : "(none)";
}

async function runOne(entry: FixtureEntry, label: string, knownPlants: string[]): Promise<Run> {
  const started = Date.now();
  const base = {
    id: entry.id,
    input: entry.input,
    category: entry.category,
    label,
    known_plants: knownPlants,
  };

  let outcome: Run["outcome"];
  let trace: LookupTrace | null = null;
  try {
    const result = await lookupPlantByName(entry.input, knownPlants);
    outcome = result.outcome;
    trace = result.trace;
  } catch (err) {
    outcome = { kind: "error", message: err instanceof Error ? err.message : String(err) };
  }
  const total_ms = Date.now() - started;
  const candidates = trace?.candidates ?? [];

  let expected_position: Run["expected_position"] = null;
  if (entry.expected) {
    const index = candidates.findIndex((c) => matchesExpected(c, entry.expected!));
    expected_position = index === 0 ? "top" : index > 0 ? "in-three" : "missing";
  }

  const final_confidence =
    outcome.kind === "resolved" ? "high" : outcome.kind === "suggest" ? "medium" : outcome.kind;

  let check: Run["check"] = "-";
  let check_note = "";
  if (outcome.kind === "error") {
    check = "FAIL";
    check_note = outcome.message;
  } else if (entry.expect_none) {
    check = outcome.kind === "none" || outcome.kind === "low" ? "pass" : "FAIL";
    if (check === "FAIL") check_note = `expected nothing, got ${outcome.kind}`;
  } else if (entry.must_not_be_high) {
    if (outcome.kind !== "resolved") check = "pass";
    else if (entry.trap_cultivar && fold(outcome.candidate.cultivar ?? "") !== fold(entry.trap_cultivar)) {
      check = "warn";
      check_note = `fake cultivar dropped, but resolved high as ${nameOf(outcome.candidate)}`;
    } else {
      check = "FAIL";
      check_note = `reached high as ${nameOf(outcome.candidate)}`;
    }
  } else if (entry.expected) {
    check = expected_position === "top" ? "pass" : expected_position === "in-three" ? "warn" : "FAIL";
    if (outcome.kind === "resolved" && expected_position !== "top") {
      check = "FAIL";
      check_note = `confidently wrong: ${nameOf(outcome.candidate)}`;
    }
  }

  return { ...base, outcome, trace, expected_position, final_confidence, check, check_note, total_ms };
}

function cell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function row(run: Run): string {
  const t = run.trace;
  const candidates =
    (t?.candidates ?? [])
      .map((c) => `${nameOf(c)} [${c.confidence}→${c.final_confidence}, wiki ${c.verification}]`)
      .join("; ") || "(none)";
  const summary =
    run.outcome.kind === "resolved"
      ? run.outcome.details.summary
        ? `(${run.outcome.details.summary.summary_scope}) ${run.outcome.details.summary.summary}`
        : "(no summary)"
      : "";
  const image = run.outcome.kind === "resolved" ? (run.outcome.details.image ? "yes" : "no") : "";
  const ms = `${t?.resolver?.ms ?? 0}/${t?.wikipedia_ms ?? 0}/${t?.summary?.ms ?? 0}`;
  const tokensIn = (t?.resolver?.input_tokens ?? 0) + (t?.summary?.input_tokens ?? 0);
  const tokensOut = (t?.resolver?.output_tokens ?? 0) + (t?.summary?.output_tokens ?? 0);
  const input = run.input.length > 48 ? `${run.input.slice(0, 45)}…` : run.input;
  return `| ${[
    run.id,
    run.label,
    cell(input),
    run.final_confidence,
    cell(candidates),
    run.expected_position ?? "",
    cell(summary),
    image,
    ms,
    `${tokensIn}/${tokensOut}`,
    run.check + (run.check_note ? ` (${cell(run.check_note)})` : ""),
  ].join(" | ")} |`;
}

async function main() {
  const args = process.argv.slice(2);
  const outPath = args.find((a) => !a.startsWith("--")) ?? "eval-fixture-capture/shopping-lookup-results.json";
  const only = args.find((a) => a.startsWith("--only="))?.slice(7).split(",");

  const fixturePath = path.join(__dirname, "eval-shopping-lookup.fixture.json");
  const fixture = (JSON.parse(await readFile(fixturePath, "utf8")) as FixtureEntry[]).filter(
    (entry) => !only || only.includes(entry.category)
  );

  const jobs: (() => Promise<Run>)[] = [];
  for (const entry of fixture) {
    if (entry.category === "priors") {
      jobs.push(() => runOne(entry, "no priors", []));
      jobs.push(() => runOne(entry, "with priors", entry.known_plants ?? []));
    } else if (REPEAT_CATEGORIES.has(entry.category)) {
      jobs.push(() => runOne(entry, "run 1", []));
      jobs.push(() => runOne(entry, "run 2", []));
    } else {
      jobs.push(() => runOne(entry, "", []));
    }
  }

  const runs: Run[] = new Array(jobs.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < jobs.length) {
        const index = next++;
        runs[index] = await jobs[index]();
        process.stderr.write(".");
      }
    })
  );
  process.stderr.write("\n");

  console.log(
    "| id | run | input | final | candidates [model→final, wiki] | expected | summary | image | ms resolve/wiki/summary | tokens in/out | check |"
  );
  console.log("|---|---|---|---|---|---|---|---|---|---|---|");
  for (const run of runs) console.log(row(run));

  // Pairs: repeat runs and with/without priors.
  const disagreements: string[] = [];
  const byId = new Map<string, Run[]>();
  for (const run of runs) byId.set(run.id, [...(byId.get(run.id) ?? []), run]);
  for (const [id, pair] of byId) {
    if (pair.length !== 2) continue;
    const [a, b] = pair;
    if (topOf(a) !== topOf(b) || a.final_confidence !== b.final_confidence) {
      disagreements.push(
        `${id}: ${a.label} → ${topOf(a)} (${a.final_confidence}); ${b.label} → ${topOf(b)} (${b.final_confidence})`
      );
    }
  }

  const count = (check: Run["check"]) => runs.filter((r) => r.check === check).length;
  const tokens = runs.reduce(
    (sum, r) => ({
      input: sum.input + (r.trace?.resolver?.input_tokens ?? 0) + (r.trace?.summary?.input_tokens ?? 0),
      output: sum.output + (r.trace?.resolver?.output_tokens ?? 0) + (r.trace?.summary?.output_tokens ?? 0),
    }),
    { input: 0, output: 0 }
  );
  const totals = runs.map((r) => r.total_ms).sort((x, y) => x - y);

  console.log(`\n=== Summary ===`);
  console.log(`Runs: ${runs.length} — pass ${count("pass")}, warn ${count("warn")}, FAIL ${count("FAIL")}, unchecked ${count("-")}`);
  console.log(`Latency (whole lookup): median ${totals[Math.floor(totals.length / 2)]}ms, max ${totals[totals.length - 1]}ms`);
  console.log(`Tokens: ${tokens.input} in, ${tokens.output} out`);
  console.log(`Disagreements between paired runs: ${disagreements.length}`);
  for (const line of disagreements) console.log(`  ! ${line}`);

  await writeFile(
    outPath,
    JSON.stringify({ ranAt: new Date().toISOString(), tokens, disagreements, runs }, null, 2)
  );
  console.log(`\nWrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
