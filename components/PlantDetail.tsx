"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { plantDisplayTitle } from "@/lib/plantName";
import { PlantName } from "@/components/plants/PlantName";
import { SunBadgePill } from "@/components/ui/SunBadge";
import { FloweringSeasonBadge } from "@/components/ui/FloweringSeasonBadge";
import type { Plant, PlantInsert, SunNeeds } from "@/lib/types";
import { updatePlantField } from "@/app/actions/plants";
import DeletePlantButton from "@/components/DeletePlantButton";
import { Button } from "@/components/ui/Button";
import {
  ACCEPTED_INPUT_TYPES,
  ACCEPTED_INPUT_TYPES_LABEL,
  MAX_ORIGINAL_SIZE,
  MAX_ORIGINAL_SIZE_LABEL,
} from "@/lib/upload";
import { resizeImage } from "@/lib/resize";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SUN_OPTIONS: SunNeeds[] = ["full sun", "full sun / partial shade", "partial shade", "full shade"];
const now = new Date();
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => now.getFullYear() - i);

const INPUT = "border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";
const INPUT_W = `w-full ${INPUT}`;
const INPUT_FLEX = `flex-1 min-w-0 ${INPUT}`;
const PROMPT_CLS = "text-sm text-gray-400";
const EDITABLE = "cursor-pointer rounded-[8px] transition-colors duration-[120ms] ease-in-out hover:bg-moss-tint/60 px-2 py-1.5 -ml-2 -mt-1.5";

// ─── Icons ────────────────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="8" y1="2" x2="8" y2="14" />
      <line x1="2" y1="8" x2="14" y2="8" />
    </svg>
  );
}

function SeedlingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22V12" />
      <path d="M12 12C12 8 9 5 5 5c0 4 3 7 7 7z" />
      <path d="M12 12C12 8 15 5 19 5c0 4-3 7-7 7z" />
    </svg>
  );
}

const SECTION_LABEL = "text-xs font-semibold font-sans uppercase tracking-wider text-ink-soft";

function SproutIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M24 8c-4 0-8 4-8 8s4 8 8 8c0 4-2 8-8 12h16c-6-4-8-8-8-12 4 0 8-4 8-8s-4-8-8-8z" />
    </svg>
  );
}

// ─── Module-scope helpers ─────────────────────────────────────────────────────

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

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-moss-tint hover:bg-moss-tint/70 text-ink rounded-full px-[10px] py-[4px] text-[13px] font-sans transition-colors duration-[120ms]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="text-ink-soft hover:text-ink transition-colors leading-none"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <line x1="1" y1="1" x2="9" y2="9" />
          <line x1="9" y1="1" x2="1" y2="9" />
        </svg>
      </button>
    </span>
  );
}

function CommonNamesSection({
  plantId,
  initialNames,
  aiLookupEnabled,
  onNamesChange,
}: {
  plantId: string;
  initialNames: string[];
  aiLookupEnabled: boolean;
  onNamesChange: (names: string[]) => void;
}) {
  const [savedNames, setSavedNames] = useState<string[]>(initialNames);
  const [phase, setPhase] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const [addingName, setAddingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [patchError, setPatchError] = useState<string | null>(null);
  const addContainerRef = useRef<HTMLDivElement>(null);

  const hasSaved = savedNames.length > 0;

  async function patch(names: string[]) {
    const res = await fetch(`/api/plants/${plantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ common_names: names }),
    });
    if (!res.ok) throw new Error("Save failed");
    setSavedNames(names);
    onNamesChange(names);
  }

  async function runLookup() {
    setPhase("loading");
    setPatchError(null);
    try {
      const res = await fetch(`/api/plants/${plantId}/lookup`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lookup failed");
      const names: string[] = Array.isArray(data.common_names) ? data.common_names : [];
      if (names.length === 0) {
        setPhase("empty");
      } else {
        await patch(names);
        setPhase("idle");
      }
    } catch {
      setPhase("error");
    }
  }

  async function removeName(name: string) {
    setPatchError(null);
    try {
      await patch(savedNames.filter(n => n !== name));
    } catch {
      setPatchError("Remove failed. Please try again.");
    }
  }

  async function saveNewName() {
    const trimmed = newName.trim();
    if (!trimmed) { setAddingName(false); setNewName(""); return; }
    try {
      await patch([...savedNames, trimmed]);
      setNewName("");
      setAddingName(false);
    } catch {
      setPatchError("Save failed. Please try again.");
    }
  }

  function cancelNewName() {
    setAddingName(false);
    setNewName("");
  }

  return (
    <div className="space-y-3">
      {/* Saved chips */}
      {hasSaved && (
        <div className="flex flex-wrap gap-2">
          {savedNames.map(name => (
            <Chip key={name} label={name} onRemove={() => removeName(name)} />
          ))}
        </div>
      )}

      {/* No saved names — lookup button or loading */}
      {!hasSaved && aiLookupEnabled && phase !== "loading" && (
        <Button type="button" variant="secondary" onClick={runLookup}>
          Get common names
        </Button>
      )}
      {!hasSaved && phase === "loading" && (
        <Button type="button" variant="secondary" disabled>
          Looking up…
        </Button>
      )}

      {/* Empty result */}
      {phase === "empty" && (
        <p className="font-display italic text-[14px] text-ink-soft">No common names found for this plant</p>
      )}

      {/* Lookup error */}
      {phase === "error" && (
        <p className="font-display italic text-[14px] text-[#C2603C]">Lookup failed — please try again</p>
      )}

      {/* Patch error */}
      {patchError && (
        <p className="font-display italic text-[14px] text-[#C2603C]">{patchError}</p>
      )}

      {/* Manual name entry */}
      {addingName ? (
        <div ref={addContainerRef} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onBlur={e => {
                if (addContainerRef.current?.contains(e.relatedTarget as Node)) return;
                cancelNewName();
              }}
              onKeyDown={e => {
                if (e.key === "Escape") cancelNewName();
                if (e.key === "Enter") { e.preventDefault(); saveNewName(); }
              }}
              placeholder="e.g. Foxglove"
              className="w-full bg-transparent border-0 outline-none font-display italic text-[15px] text-ink pb-3 pt-[10px]"
            />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-sand-line" />
          </div>
          <SaveCancel onSave={saveNewName} onCancel={cancelNewName} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setPatchError(null); setAddingName(true); }}
          className="font-sans text-sm text-gray-400 hover:text-gray-600 transition-colors block"
        >
          + Add name
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlantDetail({
  plant: init,
  aiLookupEnabled,
}: {
  plant: Plant;
  aiLookupEnabled: boolean;
}) {
  const [plant, setPlant] = useState(init);
  const [editing, setEditing] = useState<string | null>(null);
  const [v1, setV1] = useState("");
  const [v2, setV2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoFileRef = useRef<HTMLInputElement>(null);

  function blurCancel(e: React.FocusEvent) {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    cancel();
  }

  const title = plantDisplayTitle(plant);

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

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected after an error
    e.target.value = "";

    setPhotoError(null);

    if (!(ACCEPTED_INPUT_TYPES as readonly string[]).includes(file.type)) {
      setPhotoError(`Unsupported file type. Please select a ${ACCEPTED_INPUT_TYPES_LABEL} image.`);
      return;
    }
    if (file.size > MAX_ORIGINAL_SIZE) {
      setPhotoError(`Image is too large (max ${MAX_ORIGINAL_SIZE_LABEL}). Please choose a smaller file.`);
      return;
    }

    setPhotoUploading(true);
    try {
      const blob = await resizeImage(file);

      const formData = new FormData();
      formData.append("file", blob, "photo.jpg");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error ?? "Upload failed");
      const newUrl: string = uploadData.url;

      const result = await updatePlantField(plant.id, { photo_url: newUrl });
      if (result?.error) throw new Error(result.error);

      // Delete old file only after new upload + DB save succeeded
      const oldUrl = plant.photo_url;
      if (oldUrl) {
        fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: oldUrl }),
        }).catch(() => console.error("Failed to delete old photo from storage"));
      }

      setPlant(p => ({ ...p, photo_url: newUrl }));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setPhotoUploading(false);
    }
  }

  function textSave(field: keyof PlantInsert) {
    commit({ [field]: v1.trim() || null } as Partial<PlantInsert>);
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
        <Link href="/plants" className="inline-flex items-center gap-1.5 -ml-2 px-2 py-1.5 rounded-md text-sm text-moss-700 no-underline transition-colors duration-150 hover:bg-sand-line focus-visible:bg-sand-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-400">← My Plants</Link>
        <div className="flex gap-3">
          <Link
            href="/plants/new"
            className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium font-sans bg-moss text-white hover:bg-moss-deep transition-colors"
          >
            + Add another
          </Link>
          <DeletePlantButton id={plant.id} name={title} />
        </div>
      </div>

      <div>
        {/* Photo zone — click to add/replace photo */}
        <div
          className="group relative w-full aspect-[4/3] cursor-pointer rounded-lg overflow-hidden"
          onClick={() => photoFileRef.current?.click()}
        >
          {plant.photo_url ? (
            <>
              <Image src={plant.photo_url} alt={title} fill className="object-cover" />
              <div className="absolute inset-0 bg-moss-tint/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none text-moss-deep">
                <CameraIcon />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-moss-tint flex flex-col items-center justify-center gap-2 text-moss-deep/70 group-hover:brightness-95 transition-all">
              <SproutIcon />
              <span className="font-display italic text-[15px]">add a photo</span>
            </div>
          )}

          {/* Photo count pill — bottom-left, only when a photo exists */}
          {plant.photo_url && (
            <span className="absolute bottom-2.5 left-2.5 flex items-center rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-sans font-medium text-white leading-none pointer-events-none">
              1 photo
            </span>
          )}

          {/* Add photo button — top-right */}
          <button
            type="button"
            aria-label="Add photo"
            onClick={e => { e.stopPropagation(); photoFileRef.current?.click(); }}
            className="absolute top-2.5 right-2.5 flex items-center justify-center w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <PlusIcon />
          </button>

          {photoUploading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none">
              <div className="w-6 h-6 border-2 border-moss border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <input
          ref={photoFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />

        <div className="p-2 md:p-4 space-y-8">
          {photoError && (
            <p className="font-display italic text-[14px] text-[#C2603C]">{photoError}</p>
          )}
          <div className="mb-3">
            <PlantName
              species={plant.species}
              cultivar={plant.cultivar}
              commonNames={plant.common_names}
              variant="detail"
            />
          </div>

          {(plant.sun_needs || (plant.flowering_season_from !== null && plant.flowering_season_to !== null)) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {plant.sun_needs && <SunBadgePill value={plant.sun_needs} />}
              {plant.flowering_season_from !== null && plant.flowering_season_to !== null && (
                <FloweringSeasonBadge from={plant.flowering_season_from} to={plant.flowering_season_to} />
              )}
            </div>
          )}

          {/* ── Identity ─────────────────────────────────────────────────── */}
          <section>
            <p className={`${SECTION_LABEL} mb-3`}>Identity</p>
            <div className="bg-paper-deep rounded-[10px] overflow-hidden">
              {/* Species + Cultivar — two columns, reflows to stacked while either is being edited */}
              <div className={`grid border-b border-paper-line ${
                editing === "species" || editing === "cultivar"
                  ? "grid-cols-1 divide-y divide-paper-line"
                  : "grid-cols-2 divide-x divide-paper-line"
              }`}>
                <div className="px-4 py-3 min-w-0">
                  <p className="text-[11px] font-sans font-medium text-ink-soft mb-0.5">Species</p>
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
                </div>
                <div className="px-4 py-3 min-w-0">
                  <p className="text-[11px] font-sans font-medium text-ink-soft mb-0.5">Cultivar</p>
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
                </div>
              </div>

              {/* Common names — full width row, directly on panel background */}
              <div className="px-4 py-3">
                <p className="text-[11px] font-sans font-medium text-ink-soft mb-0.5">Common names</p>
                <CommonNamesSection
                  plantId={plant.id}
                  initialNames={plant.common_names ?? []}
                  aiLookupEnabled={aiLookupEnabled}
                  onNamesChange={names => setPlant(p => ({ ...p, common_names: names }))}
                />
              </div>
            </div>
          </section>

          {/* ── Growing conditions ───────────────────────────────────────── */}
          <section>
            <p className={`${SECTION_LABEL} mb-3`}>Growing conditions</p>
            <div className="bg-paper-deep rounded-[10px] overflow-hidden">
              {/* Row 1: Height | Spread */}
              <div className={`grid border-b border-paper-line ${
                editing === "eventual_height_cm" || editing === "eventual_spread_cm"
                  ? "grid-cols-1 divide-y divide-paper-line"
                  : "grid-cols-2 divide-x divide-paper-line"
              }`}>
                <div className="px-4 py-3 min-w-0">
                  <p className="text-[11px] font-sans font-medium text-ink-soft mb-0.5">Height (mature)</p>
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
                </div>
                <div className="px-4 py-3 min-w-0">
                  <p className="text-[11px] font-sans font-medium text-ink-soft mb-0.5">Spread (mature)</p>
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
                </div>
              </div>
              {/* Row 2: Sun needs | Flowering season */}
              <div className={`grid ${
                editing === "sun_needs" || editing === "flowering_season"
                  ? "grid-cols-1 divide-y divide-paper-line"
                  : "grid-cols-2 divide-x divide-paper-line"
              }`}>
                <div className="px-4 py-3 min-w-0">
                  <p className="text-[11px] font-sans font-medium text-ink-soft mb-0.5">Sun needs</p>
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
                </div>
                <div className="px-4 py-3 min-w-0">
                  <p className="text-[11px] font-sans font-medium text-ink-soft mb-0.5">Flowering season</p>
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
                </div>
              </div>
            </div>
          </section>

          {/* ── In your garden ───────────────────────────────────────────── */}
          <section>
            <p className={`${SECTION_LABEL} mb-3`}>In your garden</p>
            <div className="bg-paper-deep rounded-lg px-4 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-sand-line/60 flex items-center justify-center shrink-0 text-ink-soft">
                <SeedlingIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-sans font-medium text-ink-soft mb-0.5">Planted</p>
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
              </div>
            </div>
          </section>

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
