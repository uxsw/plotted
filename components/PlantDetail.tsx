"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ScientificName, plantDisplayTitle } from "@/lib/plantName";
import type { Plant, PlantInsert, SunNeeds } from "@/lib/types";
import { updatePlantField } from "@/app/actions/plants";
import DeletePlantButton from "@/components/DeletePlantButton";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SUN_OPTIONS: SunNeeds[] = ["full sun", "full sun / partial shade", "partial shade", "full shade"];
const now = new Date();
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => now.getFullYear() - i);

const INPUT = "w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";
const PROMPT_CLS = "text-sm text-gray-400";
const EDITABLE = "cursor-pointer rounded-[8px] transition-colors duration-[120ms] ease-in-out hover:bg-moss-tint/60 px-2 py-1.5 -ml-2 -mt-1.5";

// Defined outside component so React doesn't treat them as new types each render
function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-gray-500 font-medium text-sm">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function Tap({ value, placeholder, onClick }: {
  value: React.ReactNode;
  placeholder: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`text-left w-full ${EDITABLE}`}>
      {value
        ? <span className="text-sm text-gray-900">{value}</span>
        : <span className={PROMPT_CLS}>{placeholder}</span>
      }
    </button>
  );
}

export default function PlantDetail({ plant: init }: { plant: Plant }) {
  const [plant, setPlant] = useState(init);
  const [editing, setEditing] = useState<string | null>(null);
  const [v1, setV1] = useState("");
  const [v2, setV2] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const title = plantDisplayTitle(plant);
  const hasScientific = !!(plant.species || plant.cultivar);

  function open(field: string, val1: string, val2 = "") {
    setEditing(field);
    setV1(val1);
    setV2(val2);
    setErr(null);
  }

  function cancel() {
    setEditing(null);
    setErr(null);
  }

  async function commit(data: Partial<PlantInsert>) {
    try {
      const result = await updatePlantField(plant.id, data);
      if (result?.error) { setErr(result.error); return; }
      setPlant(p => ({ ...p, ...(data as Partial<Plant>) }));
      setEditing(null);
      setErr(null);
    } catch {
      setErr("Failed to save. Please try again.");
    }
  }

  function esc(e: React.KeyboardEvent) {
    if (e.key === "Escape") cancel();
  }

  function groupBlur(save: () => void) {
    return (e: React.FocusEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) save();
    };
  }

  function textSave(field: keyof PlantInsert) {
    commit({ [field]: v1.trim() || null } as Partial<PlantInsert>);
  }

  function textKeyDown(e: React.KeyboardEvent, field: keyof PlantInsert) {
    if (e.key === "Escape") { cancel(); return; }
    if (e.key === "Enter") { e.preventDefault(); textSave(field); }
  }

  function speciesSave() {
    if (!v1.trim()) { setErr("Species is required."); return; }
    commit({ species: v1.trim() });
  }

  function numSave(field: "eventual_height_cm" | "eventual_spread_cm") {
    commit({ [field]: v1 ? parseInt(v1) : null });
  }

  function datePlantedDisplay() {
    if (!plant.date_planted) return null;
    const d = new Date(plant.date_planted);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }

  function flowerDisplay() {
    const f = plant.flowering_season_from, t = plant.flowering_season_to;
    if (!f && !t) return null;
    if (f && t) return `${MONTHS[f - 1]} – ${MONTHS[t - 1]}`;
    return MONTHS[(f ?? t)! - 1];
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <Link href="/plants" className="text-sm text-gray-500 hover:underline">← My Plants</Link>
        <div className="flex gap-3">
          <Link
            href="/plants/new"
            className="inline-flex items-center rounded border border-moss px-3 py-1.5 text-sm font-medium font-sans text-moss hover:bg-moss-tint transition-colors"
          >
            Add another
          </Link>
          <DeletePlantButton id={plant.id} name={title} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {plant.photo_url && (
          <div className="relative w-full h-64">
            <Image src={plant.photo_url} alt={title} fill className="object-cover" />
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* Derived title — updates as fields change */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {plant.common_name || (hasScientific
                ? <ScientificName species={plant.species} cultivar={plant.cultivar} />
                : "Unnamed plant"
              )}
            </h1>
            {plant.common_name && hasScientific && (
              <p className="text-sm text-gray-500 mt-0.5">
                <ScientificName species={plant.species} cultivar={plant.cultivar} />
              </p>
            )}
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">

            {/* Species */}
            <Field label="Species">
              {editing === "species" ? (
                <>
                  <input autoFocus type="text" value={v1}
                    onChange={e => setV1(e.target.value)}
                    onBlur={speciesSave}
                    onKeyDown={e => { if (e.key === "Escape") cancel(); if (e.key === "Enter") { e.preventDefault(); speciesSave(); } }}
                    className={INPUT} />
                  {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
                </>
              ) : (
                <Tap
                  value={plant.species ? <em>{plant.species}</em> : null}
                  placeholder="+ Add species"
                  onClick={() => open("species", plant.species ?? "")}
                />
              )}
            </Field>

            {/* Cultivar */}
            <Field label="Cultivar">
              {editing === "cultivar" ? (
                <>
                  <input autoFocus type="text" value={v1}
                    onChange={e => setV1(e.target.value)}
                    onBlur={() => textSave("cultivar")}
                    onKeyDown={e => textKeyDown(e, "cultivar")}
                    className={INPUT} />
                  {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
                </>
              ) : (
                <Tap
                  value={plant.cultivar}
                  placeholder="+ Add cultivar"
                  onClick={() => open("cultivar", plant.cultivar ?? "")}
                />
              )}
            </Field>

            {/* Common name */}
            <Field label="Common name" wide>
              {editing === "common_name" ? (
                <>
                  <input autoFocus type="text" value={v1}
                    onChange={e => setV1(e.target.value)}
                    onBlur={() => textSave("common_name")}
                    onKeyDown={e => textKeyDown(e, "common_name")}
                    className={INPUT} />
                  {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
                </>
              ) : (
                <Tap
                  value={plant.common_name}
                  placeholder="+ Add common name"
                  onClick={() => open("common_name", plant.common_name ?? "")}
                />
              )}
            </Field>

            {/* Sun needs */}
            <Field label="Sun needs">
              {editing === "sun_needs" ? (
                <>
                  <select autoFocus value={v1}
                    onChange={e => { const val = e.target.value; setV1(val); commit({ sun_needs: (val as SunNeeds) || null }); }}
                    onKeyDown={esc}
                    className={INPUT}>
                    <option value="">— select —</option>
                    {SUN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
                </>
              ) : (
                <Tap
                  value={plant.sun_needs}
                  placeholder="+ Add sun needs"
                  onClick={() => open("sun_needs", plant.sun_needs ?? "")}
                />
              )}
            </Field>

            {/* Date planted */}
            <Field label="Date planted">
              {editing === "date_planted" ? (
                <div className="flex gap-2"
                  onBlur={groupBlur(() => {
                    commit({ date_planted: v2 && v1 ? `${v2}-${v1.padStart(2, "0")}-01` : null });
                  })}
                >
                  <select autoFocus value={v1} onChange={e => setV1(e.target.value)} onKeyDown={esc} className={INPUT}>
                    {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                  </select>
                  <select value={v2} onChange={e => setV2(e.target.value)} onKeyDown={esc} className={INPUT}>
                    {YEAR_OPTIONS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                  </select>
                  {err && <p className="text-xs text-red-600 mt-1 sm:col-span-2">{err}</p>}
                </div>
              ) : (
                <Tap
                  value={datePlantedDisplay()}
                  placeholder="+ Add date planted"
                  onClick={() => {
                    const d = plant.date_planted ? new Date(plant.date_planted) : now;
                    open("date_planted", String(d.getUTCMonth() + 1), String(d.getUTCFullYear()));
                  }}
                />
              )}
            </Field>

            {/* Flowering season */}
            <Field label="Flowering season" wide>
              {editing === "flowering_season" ? (
                <div className="flex gap-2"
                  onBlur={groupBlur(() => commit({
                    flowering_season_from: v1 ? parseInt(v1) : null,
                    flowering_season_to: v2 ? parseInt(v2) : null,
                  }))}
                >
                  <select autoFocus value={v1} onChange={e => setV1(e.target.value)} onKeyDown={esc} className={INPUT}>
                    <option value="">— from —</option>
                    {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                  </select>
                  <select value={v2} onChange={e => setV2(e.target.value)} onKeyDown={esc} className={INPUT}>
                    <option value="">— to —</option>
                    {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                  </select>
                  {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
                </div>
              ) : (
                <Tap
                  value={flowerDisplay()}
                  placeholder="+ Add flowering season"
                  onClick={() => open(
                    "flowering_season",
                    plant.flowering_season_from ? String(plant.flowering_season_from) : "",
                    plant.flowering_season_to ? String(plant.flowering_season_to) : ""
                  )}
                />
              )}
            </Field>

            {/* Height */}
            <Field label="Height (mature)">
              {editing === "eventual_height_cm" ? (
                <>
                  <input autoFocus type="number" min={1} value={v1}
                    onChange={e => setV1(e.target.value)}
                    onBlur={() => numSave("eventual_height_cm")}
                    onKeyDown={e => { if (e.key === "Escape") cancel(); if (e.key === "Enter") { e.preventDefault(); numSave("eventual_height_cm"); } }}
                    className={INPUT} />
                  {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
                </>
              ) : (
                <Tap
                  value={plant.eventual_height_cm ? `${plant.eventual_height_cm} cm` : null}
                  placeholder="+ Add height"
                  onClick={() => open("eventual_height_cm", plant.eventual_height_cm?.toString() ?? "")}
                />
              )}
            </Field>

            {/* Spread */}
            <Field label="Spread (mature)">
              {editing === "eventual_spread_cm" ? (
                <>
                  <input autoFocus type="number" min={1} value={v1}
                    onChange={e => setV1(e.target.value)}
                    onBlur={() => numSave("eventual_spread_cm")}
                    onKeyDown={e => { if (e.key === "Escape") cancel(); if (e.key === "Enter") { e.preventDefault(); numSave("eventual_spread_cm"); } }}
                    className={INPUT} />
                  {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
                </>
              ) : (
                <Tap
                  value={plant.eventual_spread_cm ? `${plant.eventual_spread_cm} cm` : null}
                  placeholder="+ Add spread"
                  onClick={() => open("eventual_spread_cm", plant.eventual_spread_cm?.toString() ?? "")}
                />
              )}
            </Field>

            {/* Purchased from */}
            <Field label="Purchased from" wide>
              {editing === "purchased_from" ? (
                <>
                  <input autoFocus type="text" value={v1}
                    onChange={e => setV1(e.target.value)}
                    onBlur={() => textSave("purchased_from")}
                    onKeyDown={e => textKeyDown(e, "purchased_from")}
                    placeholder="Nursery or shop name"
                    className={INPUT} />
                  {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
                </>
              ) : (
                <Tap
                  value={plant.purchased_from}
                  placeholder="+ Add where purchased"
                  onClick={() => open("purchased_from", plant.purchased_from ?? "")}
                />
              )}
            </Field>

          </dl>

          {/* Notes */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
            {editing === "notes" ? (
              <>
                <textarea autoFocus rows={4} value={v1}
                  onChange={e => setV1(e.target.value)}
                  onBlur={() => commit({ notes: v1.trim() || null })}
                  onKeyDown={esc}
                  className={INPUT + " resize-y"} />
                {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
              </>
            ) : (
              <button type="button" onClick={() => open("notes", plant.notes ?? "")} className={`text-left w-full ${EDITABLE}`}>
                {plant.notes
                  ? <span className="text-sm text-gray-800 whitespace-pre-wrap">{plant.notes}</span>
                  : <span className={PROMPT_CLS}>+ Add notes</span>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
