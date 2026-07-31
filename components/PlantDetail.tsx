"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import Link from "next/link";
import Image from "next/image";
import { plantDisplayTitle } from "@/lib/plantName";
import { PlantName } from "@/components/plants/PlantName";
import { SunBadgePill } from "@/components/ui/SunBadge";
import { FloweringSeasonBadge } from "@/components/ui/FloweringSeasonBadge";
import type { Plant, PlantInsert, SpeciesRef, SunNeeds } from "@/lib/types";
import { updatePlantField, markLookupNoticeSeen } from "@/app/actions/plants";
import DeletePlantButton from "@/components/DeletePlantButton";
import { Button } from "@/components/ui/Button";
import { AiNoticePanel } from "@/components/ui/AiNoticePanel";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";

import {
  ACCEPTED_INPUT_TYPES,
  ACCEPTED_INPUT_TYPES_LABEL,
  MAX_ORIGINAL_SIZE,
  MAX_ORIGINAL_SIZE_LABEL,
} from "@/lib/upload";
import { resizeImage, hashBlob } from "@/lib/resize";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SUN_OPTIONS: SunNeeds[] = ["full sun", "full sun / partial shade", "partial shade", "full shade"];
const now = new Date();
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => now.getFullYear() - i);

const INPUT = "c-input-inline";
const INPUT_W = `${INPUT}`;
const INPUT_FLEX = `${INPUT}`;
const EDITABLE = "c-input-trigger";


// ─── Module-scope helpers ─────────────────────────────────────────────────────

function Tap({ value, placeholder, onClick }: {
  value: React.ReactNode;
  placeholder: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`${EDITABLE}`}>
      {value
        ? <span>{value}</span>
        : <span>{placeholder}</span>
      }
    </button>
  );
}

function SaveCancel({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="c-input-inline__actions">
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={onSave}
        aria-label="Save"
        className="c-input-inline__button"
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
        className="c-input-inline__button is-cancel"
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
    <span className="o-chip is-info">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove name ${label}`}
        className="o-chip__action"
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
  onNamesChange,
}: {
  plantId: string;
  initialNames: string[];
  onNamesChange: (names: string[]) => void;
}) {
  const [savedNames, setSavedNames] = useState<string[]>(initialNames);
  const [addingName, setAddingName] = useState(false);
  const [newName, setNewName] = useState("");
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

  async function removeName(name: string) {
    try {
      await patch(savedNames.filter(n => n !== name));
    } catch {
      // Remove failed; savedNames stays unchanged.
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
      // Save failed; leave the input open for retry.
    }
  }

  function cancelNewName() {
    setAddingName(false);
    setNewName("");
  }

  return (
    <div className="o-stack">
      {/* Saved chips */}
      {hasSaved && (
        <div className="o-chip-group">
          {savedNames.map(name => (
            <Chip key={name} label={name} onRemove={() => removeName(name)} />
          ))}
        </div>
      )}

      {/* Manual name entry */}
      {addingName ? (
        <div ref={addContainerRef} className="c-input-inline__group">
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
            className="c-input-inline"
          />
          <SaveCancel onSave={saveNewName} onCancel={cancelNewName} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingName(true)}
          className={clsx(
            buttonStyles["o-button"],
            buttonStyles["o-button--ghost"],
            buttonStyles["o-button--flush-start"]
          )}
        >
          <Icon name="add" aria-label="Add notes" size={16} /> Add name
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlantDetail({
  plant: init,
  speciesRef,
}: {
  plant: Plant;
  speciesRef: SpeciesRef | null;
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
  const [retrying, setRetrying] = useState(false);
  const noticeSeen = init.lookup_notice_seen_at !== null;

  useEffect(() => {
    if (!noticeSeen && (init.lookup_status === "success" || init.lookup_status === "not_found")) {
      markLookupNoticeSeen(init.id);
    }
  }, [init.id, init.lookup_status, noticeSeen]);

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
      formData.append("fileHash", await hashBlob(blob));
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error ?? "Photo upload failed. Please try again.");
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

  async function retryLookup() {
    setRetrying(true);
    try {
      const res = await fetch(`/api/plants/${plant.id}/lookup`, { method: "POST" });
      if (!res.ok) {
        setPlant(p => ({ ...p, lookup_status: "error" }));
        return;
      }
      const data = await res.json();
      setPlant(p => ({
        ...p,
        lookup_status: data.lookup_status ?? p.lookup_status,
        common_names: data.common_names ?? p.common_names,
        sun_needs: data.sun_needs ?? p.sun_needs,
        flowering_season_from: data.flowering_season_from ?? p.flowering_season_from,
        flowering_season_to: data.flowering_season_to ?? p.flowering_season_to,
        eventual_height_cm: data.eventual_height_cm ?? p.eventual_height_cm,
        eventual_spread_cm: data.eventual_spread_cm ?? p.eventual_spread_cm,
        ...(data.species != null ? { species: data.species } : {}),
        ...(data.cultivar != null ? { cultivar: data.cultivar } : {}),
      }));
      if (data.lookup_status === "success" || data.lookup_status === "not_found") {
        markLookupNoticeSeen(plant.id);
      }
    } catch {
      setPlant(p => ({ ...p, lookup_status: "error" }));
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="o-stack o-page-size">
      <div className="plant-detail__action-bar">
        <Link
          href="/plants"
          className={clsx(
              buttonStyles["o-button"],
              buttonStyles["o-button--ghost"],
              buttonStyles["o-button--flush-start"]
            )}
          >
            <Icon name="back" aria-label="Go back" /> My Plants
          </Link>
        <div className="o-row">
          <Link
            href="/plants/new"
            className={clsx(
              buttonStyles["o-button"],
              buttonStyles["o-button--primary"]
            )}
          >
            <Icon name="add" aria-label="Add plant" /> Add another
          </Link>
          <DeletePlantButton id={plant.id} name={title} />
        </div>
      </div>

      {plant.lookup_status === "error" && (
        <div className="o-row">
          <p className="font-display italic text-[14px] text-[#C2603C]">
            Something went wrong looking this up.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="text-xs px-3 py-1"
            onClick={retryLookup}
            disabled={retrying}
          >
            {retrying ? "Retrying…" : "Retry"}
          </Button>
        </div>
      )}

      <div className="o-stack">
        {/* Photo zone — click to add/replace photo */}
        <div>
          <div
            className="plant-detail__image"
            onClick={() => photoFileRef.current?.click()}
          >
            {plant.photo_url ? (
              <>
                <Image src={plant.photo_url} alt={title} fill/>
                <div className="absolute inset-0 bg-moss-tint/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none text-moss-deep">
                  <Icon name="camera" aria-label="Add photo" />
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-moss-tint flex flex-col items-center justify-center gap-2 text-moss-deep/70 group-hover:brightness-95 transition-all">
                <Icon name="image" aria-label="Add a photo" size={32} />
                <span className="brevier">Add a photo</span>
              </div>
            )}

            {/* Add photo button — top-right */}
            <button
              type="button"
              aria-label="Add photo"
              onClick={e => { e.stopPropagation(); photoFileRef.current?.click(); }}
              className="is-add-photo-icon"
            >
              <Icon name="add" aria-label="Add photo" /> 
            </button>

            {photoUploading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none">
                <div className="w-6 h-6 border-2 border-moss border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {plant.image_source === "wikimedia" && plant.image_attribution && (
          <p className="o-minion">
            <a
              href={plant.image_attribution}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
              Source: Wikimedia Commons
            </a>
          </p>
        )}
        </div>
        
        <input
          ref={photoFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />

        <div className="o-stack">
          {photoError && (
            <p className="font-display italic text-[14px] text-[#C2603C]">{photoError}</p>
          )}
          {!noticeSeen && (plant.lookup_status === "success" || plant.lookup_status === "not_found") && (
            <AiNoticePanel>
              {plant.lookup_status === "success"
                ? "Some details were filled in automatically — worth a quick check for accuracy."
                : <>We couldn&apos;t find a match for &lsquo;{plant.species}&rsquo; — check the spelling, or fill in details yourself below.</>
              }
            </AiNoticePanel>
          )}
          {/* Distinct from the notice above — not a claim about AI-generated
              content, an explanation for why this record has no name.
              Placeholder copy pending Natalie's review. Not tied to a "seen"
              flag like the notice above: it's describing an ongoing state of
              the record, not a one-off event, so it persists until the
              record actually has a species. */}
          {plant.identification_status === "unidentified" && (
            <AiNoticePanel>
              We couldn&apos;t identify this plant from the photo. If you know its
              name, you can add it any time — just tap to edit.
            </AiNoticePanel>
          )}
          <PlantName
            genus={plant.genus}
            species={plant.species}
            cultivar={plant.cultivar}
            commonNames={plant.common_names}
            variant="detail"
          />

          {(plant.sun_needs || (plant.flowering_season_from !== null && plant.flowering_season_to !== null)) && (
            <div className="o-row">
              {plant.sun_needs && <SunBadgePill value={plant.sun_needs} />}
              {plant.flowering_season_from !== null && plant.flowering_season_to !== null && (
                <FloweringSeasonBadge from={plant.flowering_season_from} to={plant.flowering_season_to} />
              )}
            </div>
          )}

          {/* ── Identity ─────────────────────────────────────────────────── */}
          <div className="o-stack">
            <section className="plant-detail-section">
              <div className="plant-detail-section__card">
                {/* Species + Cultivar — two columns, reflows to stacked while either is being edited */}
                <div className={`plant-detail-section__pair ${
                  editing === "species" || editing === "cultivar"
                    ? "grid-cols-1"
                    : "grid-cols-2"
                }`}>
                  <div className="plant-detail-section__piece">
                    <p className="plant-detail-section__label">Species</p>
                    {editing === "species" ? (
                      <>
                        <div ref={containerRef} className="c-input-inline__group">
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
                  <div className="plant-detail-section__piece">
                    <p className="plant-detail-section__label">Cultivar</p>
                    {editing === "cultivar" ? (
                      <>
                        <div ref={containerRef} className="c-input-inline__group">
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
                <div className="plant-detail-section__piece">
                  <p className="plant-detail-section__label">Common names</p>
                  <CommonNamesSection
                    plantId={plant.id}
                    initialNames={plant.common_names ?? []}
                    onNamesChange={names => setPlant(p => ({ ...p, common_names: names }))}
                  />
                </div>
              </div>
            </section>

            {/* ── Growing conditions ───────────────────────────────────────── */}
            <section className="plant-detail-section">
              <p className="plant-detail-section__name">Growing conditions</p>
              <div className="plant-detail-section__card">
                {/* Row 1: Height | Spread */}
                <div className={`plant-detail-section__pair ${
                  editing === "eventual_height_cm" || editing === "eventual_spread_cm"
                    ? "grid-cols-1"
                    : "grid-cols-2"
                }`}>
                  <div className="plant-detail-section__piece">
                    <p className="plant-detail-section__label">Height (mature)</p>
                    {editing === "eventual_height_cm" ? (
                      <>
                        <div ref={containerRef} className="c-input-inline__group">
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
                  <div className="plant-detail-section__piece">
                    <p className="plant-detail-section__label">Spread (mature)</p>
                    {editing === "eventual_spread_cm" ? (
                      <>
                        <div ref={containerRef} className="c-input-inline__group">
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
                <div className={`plant-detail-section__pair ${
                  editing === "sun_needs" || editing === "flowering_season"
                    ? "grid-cols-1"
                    : "grid-cols-2"
                }`}>
                  <div className="plant-detail-section__piece">
                    <p className="plant-detail-section__label">Sun needs</p>
                    {editing === "sun_needs" ? (
                      <>
                        <div ref={containerRef} className="c-input-inline__group">
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
                  <div className="plant-detail-section__piece">
                    <p className="plant-detail-section__label">Flowering season</p>
                    {editing === "flowering_season" ? (
                      <>
                        <div ref={containerRef} className="o-row">
                          <div className="o-row expand">
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

                {/* Frost tolerance — sourced from species_reference */}
                {speciesRef?.lookup_status === "pending" && (
                  <div className="px-4 py-3 border-t border-paper-line">
                    <p className="text-[11px] font-sans font-medium text-ink-soft mb-0.5">Frost tolerance</p>
                    <p className="text-sm text-ink-soft/60 italic">Looking up…</p>
                  </div>
                )}
                {speciesRef?.lookup_status === "complete" && speciesRef.frost_tolerance_c !== null && (
                  <div className="px-4 py-3 border-t border-paper-line">
                    <p className="text-[11px] font-sans font-medium text-ink-soft mb-2">Frost tolerance</p>
                    <AiNoticePanel>
                      {speciesRef.frost_tolerance_c}°C
                      {speciesRef.frost_tolerance_notice && (
                        <span className="text-ink-soft">· {speciesRef.frost_tolerance_notice}</span>
                      )}
                    </AiNoticePanel>
                  </div>
                )}
                {/* lookup_status === 'failed', no row, or complete with null value: render nothing */}
              </div>
            </section>

            {/* ── In your garden ───────────────────────────────────────────── */}
            <section className="plant-detail-section">
              <p className="plant-detail-section__name">In your garden</p>
              <div className="plant-detail-section__card">
                <div className="plant-detail-section__planted">
                  <div className="is-icon">
                    <Icon name="sprout" aria-label="Planted" /> 
                  </div>
                  <div className="plant-detail-section__planted-form">
                    <p className="plant-detail-section__label">Planted</p>
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
              </div>
            </section>

            {/* Notes */}
            <div>
              <p className="plant-detail-section__name">Notes</p>
              {editing === "notes" ? (
                <div ref={containerRef}>
                  <textarea autoFocus rows={4} value={v1}
                    onChange={e => setV1(e.target.value)}
                    onBlur={blurCancel}
                    onKeyDown={esc}
                    className={`${INPUT_W}`} />
                  <div className="u-justify-end">
                    <SaveCancel onSave={() => commit({ notes: v1.trim() || null })} onCancel={cancel} />
                  </div>
                  {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => open("notes", plant.notes ?? "")} 
                  className={clsx(
                    buttonStyles["o-button"],
                    buttonStyles["o-button--ghost"],
                    buttonStyles["o-button--flush-start"]
                  )}
                >
                  {plant.notes
                    ? <span className="primer u-whitespace-pre-wrap">{plant.notes}</span>
                    : <span><Icon name="add" aria-label="Add notes" size={16} />  Add notes</span>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
