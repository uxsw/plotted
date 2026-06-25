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

// ─── Icons ───────────────────────────────────────────────────────────────────

function SproutIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M24 8c-4 0-8 4-8 8s4 8 8 8c0 4-2 8-8 12h16c-6-4-8-8-8-12 4 0 8-4 8-8s-4-8-8-8z" />
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UnderlineField({ label, focused, children }: {
  label: string;
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-display italic text-[15px] font-normal text-ink-soft">
        {label}
      </label>
      <div className="relative">
        {children}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-sand-line" />
        <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-moss transition-transform duration-200 ease-out origin-left ${focused ? "scale-x-100" : "scale-x-0"}`} />
      </div>
    </div>
  );
}

// ─── Image resize util ────────────────────────────────────────────────────────

// ─── Form ─────────────────────────────────────────────────────────────────────

export default function PlantForm() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [species, setSpecies] = useState("");
  const [cultivar, setCultivar] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

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
      const formData = new FormData();
      formData.append("file", photoBlob, "photo.jpg");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      return json.url as string;
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
        common_name: "",
        genus: "",
        species: species || null,
        cultivar: cultivar || null,
        date_planted: null,
        photo_url: photoUrl,
        sun_needs: null,
        flowering_season_from: null,
        flowering_season_to: null,
        eventual_height_cm: null,
        eventual_spread_cm: null,
        purchased_from: null,
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

  const inputCls = "w-full bg-transparent border-0 outline-none text-ink pb-3 pt-[10px] placeholder:text-ink-soft/30";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">{error}</p>}

      {/* Photo zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-full h-[172px] rounded-[16px] bg-moss-tint border-[1.5px] border-dashed border-moss cursor-pointer overflow-hidden flex items-center justify-center"
      >
        {photoPreview ? (
          <div className="relative w-full h-full">
            <Image src={photoPreview} alt="Preview" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-sm font-medium font-sans">Click to change</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-moss-deep/70">
            <SproutIcon />
            <span className="font-display italic text-[15px]">add a photo</span>
          </div>
        )}
      </div>
      <input type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} className="hidden" />

      {/* Species */}
      <div className="mt-6">
        <UnderlineField label="species *" focused={focusedField === "species"}>
          <input
            type="text"
            required
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            onFocus={() => setFocusedField("species")}
            onBlur={(e) => { setFocusedField(null); setSpecies(e.target.value.trim()); }}
            className={`${inputCls} font-display italic text-[18px]`}
          />
        </UnderlineField>
        {fieldErrors.species && <p className="text-xs text-red-600 mt-1">{fieldErrors.species}</p>}
      </div>

      {/* Cultivar */}
      <div className="mt-4">
        <UnderlineField label="cultivar" focused={focusedField === "cultivar"}>
          <input
            type="text"
            value={cultivar}
            onChange={(e) => setCultivar(e.target.value)}
            onFocus={() => setFocusedField("cultivar")}
            onBlur={(e) => { setFocusedField(null); setCultivar(e.target.value.trim()); }}
            className={`${inputCls} font-display italic text-[18px]`}
          />
        </UnderlineField>
      </div>

      {/* Submit */}
      <div className="mt-6">
        <Button type="submit" disabled={saving || uploading} className="w-full justify-center">
          {saving || uploading ? "Saving…" : "Add plant"}
        </Button>
      </div>
    </form>
  );
}
