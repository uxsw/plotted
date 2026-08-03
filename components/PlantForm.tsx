"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { PlantInsert } from "@/lib/types";
import { upsertPlant } from "@/app/actions/plants";
import type { FieldErrors } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import {
  ACCEPTED_INPUT_TYPES,
  ACCEPTED_INPUT_TYPES_LABEL,
  MAX_ORIGINAL_SIZE,
  MAX_ORIGINAL_SIZE_LABEL,
} from "@/lib/upload";
import { resizeImage } from "@/lib/resize";
import { uploadPlantPhoto } from "@/lib/uploadPhoto";
import PhotoIdentification from "@/components/identification/PhotoIdentification";
import type { IdentifiedPlantFields } from "@/lib/identification/name";
import { Icon } from "@/components/ui/Icon";

// ─── Sub-components ───────────────────────────────────────────────────────────

function UnderlineField({ label, focused, children }: {
  label: string;
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="c-underline-field">
      <label className="minion">
        {label}
      </label>
      <div className="relative">
        {children}
        <div className="c-underline-field__line" />
        <div className={`c-underline-field__line is-active ${focused ? "scale-x-100" : "scale-x-0"}`} />
      </div>
    </div>
  );
}

// ─── Image resize util ────────────────────────────────────────────────────────

// ─── Form ─────────────────────────────────────────────────────────────────────

export default function PlantForm() {
  const fileRef = useRef<HTMLInputElement>(null);

  const now = new Date();
  const defaultDatePlanted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [species, setSpecies] = useState("");
  const [cultivar, setCultivar] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [identificationResultsPresent, setIdentificationResultsPresent] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!(ACCEPTED_INPUT_TYPES as readonly string[]).includes(file.type)) {
      setError(`Unsupported file type. Please select a ${ACCEPTED_INPUT_TYPES_LABEL} image.`);
      return;
    }
    if (file.size > MAX_ORIGINAL_SIZE) {
      setError(`Image is too large (max ${MAX_ORIGINAL_SIZE_LABEL}). Please choose a smaller file.`);
      return;
    }

    try {
      const blob = await resizeImage(file);
      setPhotoBlob(blob);
      setPhotoPreview(URL.createObjectURL(blob));
    } catch {
      setError("Could not process image. Please try another file.");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const fakeEvent = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileChange(fakeEvent);
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoBlob) return null;
    setUploading(true);
    try {
      return await uploadPlantPhoto(photoBlob);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSaving(true);

    try {
      const photoUrl = await uploadPhoto();

      const payload: PlantInsert = {
        genus: "",
        species: species || null,
        cultivar: cultivar || null,
        date_planted: defaultDatePlanted,
        photo_url: photoUrl,
        sun_needs: null,
        flowering_season_from: null,
        flowering_season_to: null,
        eventual_height_cm: null,
        eventual_spread_cm: null,
        status: "active",
        notes: null,
        common_names: [],
      };

      const result = await upsertPlant(null, payload);
      if (!result) return;
      if ("fieldErrors" in result) {
        setFieldErrors(result.fieldErrors);
        return;
      }
      throw new Error(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  /**
   * Save path for the identification results screen — a candidate, a
   * genus-fallback pick, or "none of these" (unidentified). All three end
   * the add-plant journey directly: photo and name are already resolved by
   * this point, so there's nothing left on the form to review. Mirrors
   * handleSubmit's upload → build payload → upsertPlant sequence, reusing
   * the same save action rather than a second path.
   *
   * Deliberately does not catch: a thrown Error here is a genuine failure
   * and must propagate to PhotoIdentification's own catch, which displays it
   * inline on the results screen. upsertPlant's redirect() on success is a
   * framework-level navigation, not a normal promise resolution/rejection —
   * it's never caught here, exactly as handleSubmit above already relies on.
   */
  async function handleIdentificationSave(fields: IdentifiedPlantFields): Promise<void> {
    setError(null);
    setSaving(true);
    try {
      const photoUrl = await uploadPhoto();

      const payload: PlantInsert = {
        genus: fields.genus,
        species: fields.species,
        cultivar: null,
        species_input: fields.species_input,
        date_planted: defaultDatePlanted,
        photo_url: photoUrl,
        sun_needs: null,
        flowering_season_from: null,
        flowering_season_to: null,
        eventual_height_cm: null,
        eventual_spread_cm: null,
        status: "active",
        notes: null,
        common_names: fields.common_names,
      };

      const result = await upsertPlant(null, payload, { fromIdentification: true });
      if (!result) return; // redirected — success
      if ("error" in result) throw new Error(result.error);
      // fieldErrors shouldn't occur here — genus/species and the photo are
      // already resolved and valid by construction — but surface it plainly
      // rather than silently failing if it somehow does.
      throw new Error(Object.values(result.fieldErrors)[0] ?? "Could not save this plant.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full bg-transparent border-0 outline-none text-ink pb-3 pt-[10px] placeholder:text-ink-soft/30";

  return (
    <form onSubmit={handleSubmit} className="o-stack">
      {error && <p className="text-sm text-clay bg-clay-tint p-3 rounded mb-4">{error}</p>}

      {/* Photo zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="c-add-photo"
      >
        {photoPreview ? (
          <div className="relative w-full h-full ">
            <Image src={photoPreview} alt="Preview" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-sm font-medium font-sans">Click to change</span>
            </div>
          </div>
        ) : (
          <div className="c-add-photo__placeholder">
            <Icon name="image" aria-label="add image" />
            <span className="minion">Add a photo</span>
          </div>
        )}
      </div>
      <input type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} className="hidden" />

      {/* Identification — appears only once there's an image to identify.
          Never gates the form: the species field below is always usable.
          Every outcome here (a candidate, genus-fallback, or "none of
          these") saves directly and redirects — there is no return to this
          form once a result is chosen. */}
      {photoBlob && (
        <PhotoIdentification
          photoBlob={photoBlob}
          currentSpecies={species}
          onSelect={handleIdentificationSave}
          onResultsChange={setIdentificationResultsPresent}
        />
      )}

      {/* Manual entry — hidden once identification results are on screen.
          At that stage the choice is pick-a-card only; manual entry is
          equally available with the same effort on the next screen once a
          plant record exists, so no escape hatch is needed here. */}
      {!identificationResultsPresent && (
        <>
          {/* Species */}
          <div>
            <UnderlineField label="species" focused={focusedField === "species"}>
              <input
                type="text"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                onFocus={() => setFocusedField("species")}
                onBlur={(e) => { setFocusedField(null); setSpecies(e.target.value.trim()); }}
                className={`${inputCls}`}
              />
            </UnderlineField>
            {fieldErrors.species && <p className="text-xs text-clay mt-1">{fieldErrors.species}</p>}
          </div>

          {/* Cultivar */}
          <UnderlineField label="cultivar" focused={focusedField === "cultivar"}>
            <input
              type="text"
              value={cultivar}
              onChange={(e) => setCultivar(e.target.value)}
              onFocus={() => setFocusedField("cultivar")}
              onBlur={(e) => { setFocusedField(null); setCultivar(e.target.value.trim()); }}
              className={`${inputCls}`}
            />
          </UnderlineField>

          {/* Submit */}
          <Button type="submit" disabled={saving || uploading} className="w-full justify-center">
            {saving || uploading ? "Saving…" : "Add plant"}
          </Button>
        </>
      )}
    </form>
  );
}
