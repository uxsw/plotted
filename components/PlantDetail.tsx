"use client";

import { useState, useRef } from "react";
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

const INPUT = "border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";
const INPUT_W = `w-full ${INPUT}`;
const INPUT_FLEX = `flex-1 min-w-0 ${INPUT}`;
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

function SaveCancel({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={onSave}
        aria-label="Save"
        className="flex items-center justify-center w-8 h-8 rounded text-moss hover:bg-moss-tint transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="2,8 6,12 14,4" />
        </svg>
      </button>
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={onCancel}
        aria-label="Cancel"
        className="flex items-center justify-center w-8 h-8 rounded text-ink-soft hover:bg-sand-line/40 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="2" y1="2" x2="12" y2="12" />
          <line x1="12" y1="2" x2="2" y2="12" />
        </svg>
      </button>
    </div>
  );
}

export default function PlantDetail({ plant: init }: { plant: Plant }) {
  const [plant, setPlant] = useState(init);
  const [editing, setEditing] = useState<string | null>(null);
  const [v1, setV1] = useState("");
  const [v2, setV2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function blurCancel(e: React.FocusEvent) {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    cancel();
  }

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
                  <div ref={containerRef} className="flex items-center gap-2">
                    <input autoFocus type="text" value={v1}
                      onChange={e => setV1(e.target.value)}
                      onBlur={blurCancel}
                      onKeyDown={e => { if (e.key === "Escape") cancel(); if (e.key === "Enter") { e.preventDefault(); speciesSave(); } }}
                      className={INPUT_FLEX} />
                    <SaveCancel onSave={speciesSave} onCancel={cancel} />
                  </div>
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
                  <div ref={containerRef} className="flex items-center gap-2">
                    <input autoFocus type="text" value={v1}
                      onChange={e => setV1(e.target.value)}
                      onBlur={blurCancel}
                      onKeyDown={e => { if (e.key === "Escape") cancel(); if (e.key === "Enter") { e.preventDefault(); textSave("cultivar"); } }}
                      className={INPUT_FLEX} />
                    <SaveCancel onSave={() => textSave("cultivar")} onCancel={cancel} />
                  </div>
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
                  <div ref={containerRef} className="flex items-center gap-2">
                    <input autoFocus type="text" value={v1}
                      onChange={e => setV1(e.target.value)}
                      onBlur={blurCancel}
                      onKeyDown={e => { if (e.key === "Escape") cancel(); if (e.key === "Enter") { e.preventDefault(); textSave("common_name"); } }}
                      className={INPUT_FLEX} />
                    <SaveCancel onSave={() => textSave("common_name")} onCancel={cancel} />
                  </div>
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
                  <div ref={containerRef} className="flex items-center gap-2">
                    <select autoFocus value={v1}
                      onChange={e => setV1(e.target.value)}
                      onBlur={blurCancel}
                      onKeyDown={esc}
                      className={INPUT_FLEX}>
                      <option value="">— select —</option>
                      {SUN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <SaveCancel onSave={() => commit({ sun_needs: (v1 as SunNeeds) || null })} onCancel={cancel} />
                  </div>
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
                <>
                  <div ref={containerRef} className="flex items-center gap-2">
                    <div className="flex gap-2 flex-1 min-w-0">
                      <select autoFocus value={v1} onChange={e => setV1(e.target.value)} onBlur={blurCancel} onKeyDown={esc} className={INPUT}>
                        {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                      </select>
                      <select value={v2} onChange={e => setV2(e.target.value)} onBlur={blurCancel} onKeyDown={esc} className={INPUT}>
                        {YEAR_OPTIONS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                      </select>
                    </div>
                    <SaveCancel
                      onSave={() => commit({ date_planted: v2 && v1 ? `${v2}-${v1.padStart(2, "0")}-01` : null })}
                      onCancel={cancel}
                    />
                  </div>
                  {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
                </>
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
                <>
                  <div ref={containerRef} className="flex items-center gap-2">
                    <div className="flex gap-2 flex-1 min-w-0">
                      <select autoFocus value={v1} onChange={e => setV1(e.target.value)} onBlur={blurCancel} onKeyDown={esc} className={INPUT}>
                        <option value="">— from —</option>
                        {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                      </select>
                      <select value={v2} onChange={e => setV2(e.target.value)} onBlur={blurCancel} onKeyDown={esc} className={INPUT}>
                        <option value="">— to —</option>
                        {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                      </select>
                    </div>
                    <SaveCancel
                      onSave={() => commit({ flowering_season_from: v1 ? parseInt(v1) : null, flowering_season_to: v2 ? parseInt(v2) : null })}
                      onCancel={cancel}
                    />
                  </div>
                  {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
                </>
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
                  <div ref={containerRef} className="flex items-center gap-2">
                    <input autoFocus type="number" min={1} value={v1}
                      onChange={e => setV1(e.target.value)}
                      onBlur={blurCancel}
                      onKeyDown={e => { if (e.key === "Escape") cancel(); if (e.key === "Enter") { e.preventDefault(); numSave("eventual_height_cm"); } }}
                      className={INPUT_FLEX} />
                    <SaveCancel onSave={() => numSave("eventual_height_cm")} onCancel={cancel} />
                  </div>
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
                  <div ref={containerRef} className="flex items-center gap-2">
                    <input autoFocus type="number" min={1} value={v1}
                      onChange={e => setV1(e.target.value)}
                      onBlur={blurCancel}
                      onKeyDown={e => { if (e.key === "Escape") cancel(); if (e.key === "Enter") { e.preventDefault(); numSave("eventual_spread_cm"); } }}
                      className={INPUT_FLEX} />
                    <SaveCancel onSave={() => numSave("eventual_spread_cm")} onCancel={cancel} />
                  </div>
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
                  <div ref={containerRef} className="flex items-center gap-2">
                    <input autoFocus type="text" value={v1}
                      onChange={e => setV1(e.target.value)}
                      onBlur={blurCancel}
                      onKeyDown={e => { if (e.key === "Escape") cancel(); if (e.key === "Enter") { e.preventDefault(); textSave("purchased_from"); } }}
                      placeholder="Nursery or shop name"
                      className={INPUT_FLEX} />
                    <SaveCancel onSave={() => textSave("purchased_from")} onCancel={cancel} />
                  </div>
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
              <div ref={containerRef}>
                <textarea autoFocus rows={4} value={v1}
                  onChange={e => setV1(e.target.value)}
                  onBlur={blurCancel}
                  onKeyDown={esc}
                  className={`${INPUT_W} resize-y`} />
                <div className="flex justify-end mt-1">
                  <SaveCancel onSave={() => commit({ notes: v1.trim() || null })} onCancel={cancel} />
                </div>
                {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
              </div>
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
