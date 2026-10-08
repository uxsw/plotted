/**
 * Cleanup for plants saved with a blank genus (GitHub issue: "species_reference
 * keys are missing a genus"). Re-runs the plant lookup's name resolution on
 * each plant's stored name and reports what it would change.
 *
 *   set -a && . ./.env.local && set +a && npx tsx scripts/cleanup-blank-genus.ts [flags]
 *
 * DRY RUN IS THE DEFAULT and writes nothing to the database. It reads plants
 * and species_reference, calls the model once per distinct stored name (at
 * temperature 0, about $0.004 a call), asks Wikipedia whether the proposed
 * name has a page, prints a report and saves it as JSON under .claude-notes/.
 *
 * Flags:
 *   --active-only        Dry run: leave removed plants out of the report.
 *   --apply --from=FILE  Apply a saved report. Uses exactly the names in the
 *                        file; no model calls. Active plants only, and only
 *                        proposals marked "apply", unless:
 *   --ids=a,b,c          also apply these "review" proposals (plant ids), and
 *   --include-removed    also apply to removed plants.
 *   --orphans            Read-only: list species_reference rows that no
 *                        plant's name computes to. Nothing is deleted, ever.
 *
 * Apply order, per plant: enrich the new key first; update the plant's name
 * only once that species_reference row is complete. If enrichment fails the
 * plant is left exactly as it was and reported. Each update is conditional on
 * the plant still holding the name the report read. Only genus, species,
 * cultivar and (when the stored words change) species_input are written.
 *
 * Uses the service-role key: it has to read every user's plants.
 * Dev tooling only; nothing in the app imports this.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { performLookup, type LookupResult } from "@/lib/plant-lookup";
import { fetchWikipediaSummary } from "@/lib/wikimedia";
import { isMatchingPlantPage, wikipediaTitleFor } from "@/lib/shopping-lookup/verify";
import {
  applyProposal,
  orphanedReferenceKeys,
  proposeForPlant,
  type ApplyOutcome,
  type BlankGenusPlant,
  type Proposal,
} from "./cleanup-blank-genus-plan";

type ReferenceRow = { match_key: string; lookup_status: string | null; frost_tolerance_c: number | null };

type ReportRow = Proposal & {
  /** Whether the proposed name has a Wikipedia page about that plant. No model call. */
  wikipedia: "found" | "page is not about this plant" | "no page" | "could not ask" | "-";
  /** What applying would do to species_reference. */
  enrichment: "new row" | "reuses existing row" | "skip";
  old_frost_c: number | null;
  new_key_frost_c: number | null;
};

type Report = { generated_at: string; mode: "dry-run"; rows: ReportRow[] };

const PLANT_COLUMNS = "id, genus, species, cultivar, species_input, status, identification_status, species_source";
const LOOKUP_CONCURRENCY = 4;

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  return createClient(url, key);
}

async function inBatches<T, R>(items: T[], size: number, run: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    results.push(...(await Promise.all(items.slice(i, i + size).map(run))));
  }
  return results;
}

async function readReferences(client: ReturnType<typeof db>): Promise<Map<string, ReferenceRow>> {
  const { data, error } = await client
    .from("species_reference")
    .select("match_key, lookup_status, frost_tolerance_c");
  if (error) throw new Error(error.message);
  return new Map((data as ReferenceRow[]).map((row) => [row.match_key, row]));
}

async function wikipediaColumn(proposal: Proposal, cache: Map<string, ReportRow["wikipedia"]>) {
  if (!proposal.proposed) return "-" as const;
  const title = wikipediaTitleFor(proposal.proposed);
  const cached = cache.get(title);
  if (cached) return cached;
  const result = await fetchWikipediaSummary(title);
  const answer: ReportRow["wikipedia"] =
    result.status === "error"
      ? "could not ask"
      : result.status === "missing"
        ? "no page"
        : isMatchingPlantPage(proposal.proposed, result.summary)
          ? "found"
          : "page is not about this plant";
  cache.set(title, answer);
  return answer;
}

const cell = (text: string | null | undefined) => (text ? text.replace(/\|/g, "\\|") : "–");
const nameCell = (n: { genus: string; species: string | null; cultivar: string | null } | null) =>
  n ? `${cell(n.genus)} / ${cell(n.species)} / ${cell(n.cultivar)}` : "–";

function printReport(rows: ReportRow[]) {
  console.log("| plant id | status | current genus / species / cultivar | proposed genus / species / cultivar | confidence | Wikipedia page found | decision | enrichment | reason |");
  console.log("|---|---|---|---|---|---|---|---|---|");
  for (const row of rows) {
    console.log(
      `| ${row.plant_id} | ${row.status} | ${nameCell(row.current)} | ${nameCell(row.proposed)} | ${row.confidence} | ${row.wikipedia} | ${row.decision} | ${row.enrichment} | ${cell(row.reason)} |`
    );
  }
  const count = (decision: string, status?: string) =>
    rows.filter((row) => row.decision === decision && (!status || row.status === status)).length;
  console.log(
    `\n${rows.length} plants: apply ${count("apply")} (${count("apply", "active")} active), ` +
      `review ${count("review")} (${count("review", "active")} active), skip ${count("skip")}.`
  );
}

async function dryRun() {
  const client = db();
  let query = client.from("plants").select(PLANT_COLUMNS).or("genus.is.null,genus.eq.").not("species", "is", null);
  if (flag("active-only")) query = query.eq("status", "active");
  const { data, error } = await query.order("created_at");
  if (error) throw new Error(error.message);
  const plants = data as BlankGenusPlant[];
  const references = await readReferences(client);

  // One model call per distinct stored name, not per plant.
  const nameKey = (plant: BlankGenusPlant) => `${plant.species}\u0000${plant.cultivar ?? ""}`;
  const distinct = [...new Map(plants.map((plant) => [nameKey(plant), plant])).values()];
  console.error(`${plants.length} blank-genus plants, ${distinct.length} distinct names to look up…`);

  const lookups = new Map<string, LookupResult | null>();
  await inBatches(distinct, LOOKUP_CONCURRENCY, async (plant) => {
    try {
      lookups.set(nameKey(plant), await performLookup("", plant.species!, plant.cultivar, { temperature: 0 }));
    } catch (err) {
      console.error(`lookup failed for "${plant.species}":`, err instanceof Error ? err.message : err);
      lookups.set(nameKey(plant), null);
    }
  });

  const wikipedia = new Map<string, ReportRow["wikipedia"]>();
  const rows: ReportRow[] = [];
  for (const plant of plants) {
    const proposal = proposeForPlant(plant, lookups.get(nameKey(plant)) ?? null);
    const existing = proposal.new_key ? references.get(proposal.new_key) : undefined;
    rows.push({
      ...proposal,
      wikipedia: await wikipediaColumn(proposal, wikipedia),
      enrichment: proposal.decision === "skip" ? "skip" : existing?.lookup_status === "complete" ? "reuses existing row" : "new row",
      old_frost_c: references.get(proposal.old_key)?.frost_tolerance_c ?? null,
      new_key_frost_c: existing?.frost_tolerance_c ?? null,
    });
  }

  printReport(rows);

  const report: Report = { generated_at: new Date().toISOString(), mode: "dry-run", rows };
  const out = path.join(".claude-notes", `blank-genus-cleanup-${report.generated_at.slice(0, 10)}.json`);
  await mkdir(".claude-notes", { recursive: true });
  await writeFile(out, JSON.stringify(report, null, 2));
  console.log(`\nDry run: nothing was written to the database. Report saved to ${out}`);
}

async function apply() {
  const from = value("from");
  if (!from) throw new Error("--apply needs --from=<report.json> from a dry run you have reviewed");
  const report = JSON.parse(await readFile(from, "utf8")) as Report;
  const reviewedIds = new Set((value("ids") ?? "").split(",").filter(Boolean));
  const client = db();
  // Imported here so a dry run never loads the code that writes species_reference.
  const { enrichSpeciesReference } = await import("@/lib/species-reference-enrichment");

  const outcomes: ApplyOutcome[] = [];
  // One at a time: two plants sharing a new key must not race its enrichment.
  for (const proposal of report.rows) {
    outcomes.push(
      await applyProposal(
        proposal,
        {
          async readPlant(id) {
            const { data } = await client.from("plants").select(PLANT_COLUMNS).eq("id", id).maybeSingle();
            return (data as BlankGenusPlant | null) ?? null;
          },
          enrich: (names) => enrichSpeciesReference(names.genus, names.species, names.cultivar),
          async referenceStatus(matchKey) {
            const { data } = await client
              .from("species_reference")
              .select("lookup_status")
              .eq("match_key", matchKey)
              .maybeSingle();
            return (data?.lookup_status as string | undefined) ?? null;
          },
          async updatePlant(id, expected, update) {
            let query = client.from("plants").update(update).eq("id", id).or("genus.is.null,genus.eq.");
            query = expected.species === null ? query.is("species", null) : query.eq("species", expected.species);
            query = expected.cultivar === null ? query.is("cultivar", null) : query.eq("cultivar", expected.cultivar);
            const { data, error } = await query.select("id");
            if (error) throw new Error(error.message);
            return (data?.length ?? 0) === 1;
          },
        },
        { includeRemoved: flag("include-removed"), reviewedIds }
      )
    );
  }

  for (const outcome of outcomes) {
    console.log(
      outcome.result === "updated"
        ? `updated   ${outcome.plant_id} → ${outcome.new_key}`
        : `untouched ${outcome.plant_id}: ${outcome.why}`
    );
  }
  const updated = outcomes.filter((outcome) => outcome.result === "updated").length;
  console.log(`\n${updated} updated, ${outcomes.length - updated} untouched. No species_reference rows were deleted.`);
}

async function orphans() {
  const client = db();
  const references = await readReferences(client);
  const { data, error } = await client.from("plants").select("genus, species, cultivar, status");
  if (error) throw new Error(error.message);
  const rows = orphanedReferenceKeys([...references.keys()], data as BlankGenusPlant[]);
  console.log("| match_key | frost °C | still matched by a removed plant |");
  console.log("|---|---|---|");
  for (const row of rows) {
    console.log(`| ${cell(row.match_key)} | ${references.get(row.match_key)?.frost_tolerance_c ?? "–"} | ${row.matched_by_removed ? "yes" : "no"} |`);
  }
  console.log(`\n${rows.length} of ${references.size} species_reference rows match no active plant. Read-only: nothing was changed.`);
}

const main = flag("orphans") ? orphans : flag("apply") ? apply : dryRun;
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
