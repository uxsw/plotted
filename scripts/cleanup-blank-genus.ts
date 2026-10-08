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
 *   --compare=FILE       Dry run: also list every plant whose proposal differs
 *                        from an earlier report.
 *
 * Working from a saved report (no model calls). A batch is always an explicit
 * list of plant ids — full, or the first 8 characters. Naming an id is the
 * sign-off: it covers "review" proposals and ones skipped for confidence.
 *   --preview --from=FILE --ids=a,b,c
 *                        Read-only: show exactly what the batch would change.
 *   --apply --from=FILE --ids=a,b,c
 *                        Print the same table, write an undo file to
 *                        .claude-notes/, then apply. Active plants only unless
 *                        --include-removed.
 *   --name=ID=Genus/species/Cultivar
 *                        With --preview or --apply: use this name for one
 *                        plant instead of the report's ("-" for no species or
 *                        cultivar). Repeat for more plants.
 *   --undo --from=UNDOFILE
 *                        Put back the names an apply replaced. Each row is
 *                        restored only if it still holds what the apply wrote,
 *                        so later edits are not overwritten.
 *   --orphans            Read-only: list species_reference rows that no
 *                        plant's name computes to. Nothing is deleted, ever.
 *
 * Apply order, per plant: enrich the new key first; update the plant's name
 * only once that species_reference row is complete. If enrichment fails the
 * plant is left exactly as it was and reported. Each update is conditional on
 * the plant still holding the name the report read. Only genus, species,
 * cultivar and (for a typed common name) species_input are written.
 *
 * Uses the service-role key: it has to read every user's plants.
 * Dev tooling only; nothing in the app imports this.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { parseResolvedName, performLookup, type LookupResult } from "@/lib/plant-lookup";
import { fetchWikipediaSummary } from "@/lib/wikimedia";
import { isMatchingPlantPage, wikipediaTitleFor } from "@/lib/shopping-lookup/verify";
import {
  applyProposal,
  changedProposals,
  orphanedReferenceKeys,
  plantUpdateFor,
  proposeForPlant,
  resolveIds,
  storedNameKey,
  undoEntry,
  undoEntryFor,
  withCurrentSpeciesInputRule,
  withNameSetByHand,
  type ApplyOutcome,
  type BlankGenusPlant,
  type Proposal,
  type UndoEntry,
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
const values = (name: string) =>
  args.filter((arg) => arg.startsWith(`--${name}=`)).map((arg) => arg.slice(name.length + 3));
const value = (name: string) => values(name)[0];
const stamp = () => new Date().toISOString().slice(0, 16).replace(":", "");

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

  // One model call per distinct stored name, not per plant — ignoring case,
  // so "Boskoop Ruby" and "Boskoop ruby" get the same answer.
  const nameKey = storedNameKey;
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
  const out = path.join(".claude-notes", `blank-genus-cleanup-${stamp()}.json`);
  await mkdir(".claude-notes", { recursive: true });
  await writeFile(out, JSON.stringify(report, null, 2));
  console.log(`\nDry run: nothing was written to the database. Report saved to ${out}`);

  const compare = value("compare");
  if (compare) {
    const earlier = JSON.parse(await readFile(compare, "utf8")) as Report;
    const changed = changedProposals(earlier.rows, rows);
    console.log(`\n${changed.length} plant(s) whose proposal differs from ${compare}:\n`);
    console.log("| plant id | stored name | before: proposed (confidence, decision) | now: proposed (confidence, decision) |");
    console.log("|---|---|---|---|");
    const side = (p: Proposal | null) => (p ? `${nameCell(p.proposed)} (${p.confidence}, ${p.decision})` : "not in report");
    for (const change of changed) {
      console.log(`| ${change.plant_id} | ${nameCell((change.after ?? change.before)!.current)} | ${side(change.before)} | ${side(change.after)} |`);
    }
  }
}

const NAME_COLUMNS = ["genus", "species", "cultivar", "species_input"] as const;

/** PostgREST filter: the row still holds exactly these values (blank genus matches '' or NULL). */
function whereHolds<Q extends { eq(c: string, v: string): Q; is(c: string, v: null): Q; or(f: string): Q }>(
  query: Q,
  expected: Record<string, string | null | undefined>
): Q {
  for (const column of NAME_COLUMNS) {
    if (!(column in expected)) continue;
    const want = expected[column] ?? null;
    if (column === "genus" && !want) query = query.or("genus.is.null,genus.eq.");
    else query = want === null ? query.is(column, null) : query.eq(column, want);
  }
  return query;
}

/** The batch named by --ids, with any --name replacements, from a saved report. */
async function loadBatch(): Promise<{ batch: Proposal[]; ids: Set<string> }> {
  const from = value("from");
  if (!from) throw new Error("--from=<report.json> is required: a dry-run report you have reviewed");
  const report = JSON.parse(await readFile(from, "utf8")) as Report;
  const wanted = (value("ids") ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (wanted.length === 0) throw new Error("--ids=<plant ids> is required: a batch is always an explicit list");

  const known = report.rows.map((row) => row.plant_id);
  const { ids, problems } = resolveIds(wanted, known);

  const names = new Map<string, { genus: string; species: string | null; cultivar: string | null }>();
  for (const entry of values("name")) {
    const cut = entry.indexOf("=");
    const idPart = cut === -1 ? entry : entry.slice(0, cut);
    const namePart = cut === -1 ? "" : entry.slice(cut + 1);
    const resolved = resolveIds([idPart], known);
    const [genus, species, cultivar] = namePart.split("/").map((part) => part.trim());
    const blank = (part: string | undefined) => (!part || part === "-" ? null : part);
    const parsed = parseResolvedName({
      resolved_genus: genus,
      resolved_species: blank(species),
      resolved_cultivar: blank(cultivar),
      name_confidence: "high",
    });
    if (resolved.ids.size !== 1 || !parsed) problems.push(`--name=${entry} is not a known plant id and a valid Genus/species/Cultivar`);
    else names.set([...resolved.ids][0], { genus: parsed.genus, species: parsed.species, cultivar: parsed.cultivar });
  }
  for (const id of names.keys()) if (!ids.has(id)) problems.push(`--name given for ${id}, which is not in --ids`);
  if (problems.length) throw new Error(`Nothing done:\n  ${problems.join("\n  ")}`);

  const batch = report.rows
    .filter((row) => ids.has(row.plant_id))
    // The report may predate the current species_input rule; re-apply it.
    .map(withCurrentSpeciesInputRule)
    .map((row) => (names.has(row.plant_id) ? withNameSetByHand(row, names.get(row.plant_id)!) : row));
  return { batch, ids };
}

type BatchRow = { proposal: Proposal; plant: BlankGenusPlant | null; blocked: string | null; existing: string | null };

/** Reads the batch's plants and target keys as they are now. Read-only. */
async function inspectBatch(client: ReturnType<typeof db>, batch: Proposal[]): Promise<BatchRow[]> {
  const references = await readReferences(client);
  const rows: BatchRow[] = [];
  for (const proposal of batch) {
    const { data } = await client.from("plants").select(PLANT_COLUMNS).eq("id", proposal.plant_id).maybeSingle();
    const plant = (data as BlankGenusPlant | null) ?? null;
    const blocked = !proposal.proposed
      ? `no name to write (${proposal.reason})`
      : !plant
        ? "plant no longer exists"
        : (plant.genus ?? "") !== "" || plant.species !== proposal.current.species || plant.cultivar !== proposal.current.cultivar
          ? "name changed since the report was made"
          : plant.status !== "active" && !flag("include-removed")
            ? "removed plant; active only by default"
            : null;
    rows.push({ proposal, plant, blocked, existing: (proposal.new_key && references.get(proposal.new_key)?.lookup_status) || null });
  }
  return rows;
}

function printBatch(rows: BatchRow[]) {
  console.log("| plant id | current genus / species / cultivar | will become | typed as | species_input written | new key | species_reference | confidence | note |");
  console.log("|---|---|---|---|---|---|---|---|---|");
  for (const { proposal, blocked, existing } of rows) {
    const update = proposal.proposed ? plantUpdateFor(proposal) : null;
    console.log(
      `| ${proposal.plant_id} | ${nameCell(proposal.current)} | ${blocked ? "NO CHANGE" : nameCell(proposal.proposed)} | ` +
        `${proposal.typed_kind ?? "–"} | ${!blocked && update && "species_input" in update ? `"${update.species_input}"` : "none (left as it is)"} | ${cell(proposal.new_key)} | ` +
        `${blocked ? "–" : existing === "complete" ? "reuses existing row" : "new row (one model call)"} | ${proposal.confidence} | ${cell(blocked ?? proposal.reason)} |`
    );
  }
  const ready = rows.filter((row) => !row.blocked).length;
  console.log(`\n${ready} of ${rows.length} would be changed; ${rows.length - ready} blocked.`);
}

async function preview() {
  const { batch } = await loadBatch();
  printBatch(await inspectBatch(db(), batch));
  console.log("Preview only: nothing was written.");
}

async function apply() {
  const { batch, ids } = await loadBatch();
  const client = db();
  const inspected = await inspectBatch(client, batch);
  printBatch(inspected);

  // The undo file is written before anything changes, from a fresh read.
  const undo: UndoEntry[] = inspected
    .filter((row) => !row.blocked && row.plant && row.proposal.proposed)
    .map((row) => undoEntryFor(row.proposal, row.plant!));
  const undoFile = path.join(".claude-notes", `blank-genus-undo-${stamp()}.json`);
  await mkdir(".claude-notes", { recursive: true });
  await writeFile(undoFile, JSON.stringify({ created_at: new Date().toISOString(), entries: undo }, null, 2));
  console.log(`\nUndo file written: ${undoFile}\n`);

  // Imported here so a dry run or preview never loads the code that writes species_reference.
  const { enrichSpeciesReference } = await import("@/lib/species-reference-enrichment");

  const outcomes: ApplyOutcome[] = [];
  // One at a time: two plants sharing a new key must not race its enrichment.
  for (const proposal of batch) {
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
            const { data, error } = await whereHolds(client.from("plants").update(update).eq("id", id), expected).select("id");
            if (error) throw new Error(error.message);
            return (data?.length ?? 0) === 1;
          },
        },
        { ids, includeRemoved: flag("include-removed") }
      )
    );
  }

  printOutcomes(outcomes, "updated");
  console.log(`No species_reference rows were deleted. To reverse: --undo --from=${undoFile}`);
}

function printOutcomes(outcomes: ApplyOutcome[], verb: string) {
  for (const outcome of outcomes) {
    console.log(
      outcome.result === "updated"
        ? `${verb.padEnd(9)} ${outcome.plant_id} → ${outcome.new_key}`
        : `untouched ${outcome.plant_id}: ${outcome.why}`
    );
  }
  const done = outcomes.filter((outcome) => outcome.result === "updated").length;
  console.log(`\n${done} ${verb}, ${outcomes.length - done} untouched.`);
}

async function undo() {
  const from = value("from");
  if (!from) throw new Error("--undo needs --from=<undo file written by --apply>");
  const { entries } = JSON.parse(await readFile(from, "utf8")) as { entries: UndoEntry[] };
  const client = db();
  const outcomes: ApplyOutcome[] = [];
  for (const entry of entries) {
    outcomes.push(
      await undoEntry(entry, {
        async restorePlant(id, expected, restore) {
          const { data, error } = await whereHolds(client.from("plants").update(restore).eq("id", id), expected).select("id");
          if (error) throw new Error(error.message);
          return (data?.length ?? 0) === 1;
        },
      })
    );
  }
  printOutcomes(outcomes, "restored");
  console.log("species_reference rows created by the apply were left in place.");
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

const main = flag("orphans")
  ? orphans
  : flag("undo")
    ? undo
    : flag("apply")
      ? apply
      : flag("preview")
        ? preview
        : dryRun;
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
