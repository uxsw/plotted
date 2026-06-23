"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { PlantInsert, SunNeeds } from "@/lib/types";
import { upsertPlant } from "@/app/actions/plants";
import type { FieldErrors } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import {
  ACCEPTED_INPUT_TYPES,
  ACCEPTED_INPUT_TYPES_LABEL,
  MAX_ORIGINAL_SIZE,
  MAX_ORIGINAL_SIZE_LABEL,
} from "@/lib/upload";

const SUN_OPTIONS: SunNeeds[] = ["full sun", "full sun / partial shade", "partial shade", "full shade"];
const MAX_PX = 800;
const JPEG_QUALITY = 0.85;

// ─── Icons ───────────────────────────────────────────────────────────────────

function SproutIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M24 8c-4 0-8 4-8 8s4 8 8 8c0 4-2 8-8 12h16c-6-4-8-8-8-12 4 0 8-4 8-8s-4-8-8-8z" />
    </svg>
  );
}

function IconFullSun() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="3.5" />
      <line x1="11" y1="1.5" x2="11" y2="4.5" />
      <line x1="11" y1="17.5" x2="11" y2="20.5" />
      <line x1="1.5" y1="11" x2="4.5" y2="11" />
      <line x1="17.5" y1="11" x2="20.5" y2="11" />
      <line x1="4.6" y1="4.6" x2="6.6" y2="6.6" />
      <line x1="15.4" y1="15.4" x2="17.4" y2="17.4" />
      <line x1="17.4" y1="4.6" x2="15.4" y2="6.6" />
      <line x1="4.6" y1="17.4" x2="6.6" y2="15.4" />
    </svg>
  );
}

function IconSunPartialShade() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="11" r="3" />
      <line x1="9" y1="2" x2="9" y2="4.5" />
      <line x1="1.5" y1="11" x2="4" y2="11" />
      <line x1="3.4" y1="4.4" x2="5.2" y2="6.2" />
      <line x1="3.4" y1="17.6" x2="5.2" y2="15.8" />
      <line x1="9" y1="20" x2="9" y2="17.5" />
      <path d="M14 7 Q20 11 14 15" />
    </svg>
  );
}

function IconPartialShade() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13 Q3 3 11 3 Q19 3 19 13" />
      <circle cx="11" cy="17" r="2" />
    </svg>
  );
}

function IconFullShade() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12 Q2 2 11 2 Q20 2 20 12" />
      <line x1="2" y1="12" x2="20" y2="12" />
      <line x1="11" y1="12" x2="11" y2="19" />
      <line x1="8" y1="19" x2="14" y2="19" />
    </svg>
  );
}

const SUN_ICONS = [<IconFullSun />, <IconSunPartialShade />, <IconPartialShade />, <IconFullShade />];

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

function SunTile({ option, icon, selected, onSelect }: {
  option: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex flex-col items-center gap-2 rounded-[12px] py-[14px] px-2 cursor-pointer transition-colors duration-150",
        selected
          ? "border-2 border-moss bg-moss-tint"
          : "border-[1.5px] border-sand-line bg-white",
      ].join(" ")}
    >
      <span className={selected ? "text-moss" : "text-ink-soft"}>{icon}</span>
      <span className={`text-[11px] font-medium font-sans leading-tight text-center ${selected ? "text-moss-deep" : "text-ink-soft"}`}>
        {option}
      </span>
    </button>
  );
}

// ─── Image resize util ────────────────────────────────────────────────────────

function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export default function PlantForm() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [species, setSpecies] = useState("");
  const [cultivar, setCultivar] = useState("");
  const [commonName, setCommonName] = useState("");
  const [sunNeeds, setSunNeeds] = useState<SunNeeds | "">("");
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
        common_name: commonName,
        genus: "",
        species: species || null,
        cultivar: cultivar || null,
        date_planted: null,
        photo_url: photoUrl,
        sun_needs: sunNeeds || null,
        flowering_season_from: null,
        flowering_season_to: null,
        eventual_height_cm: null,
        eventual_spread_cm: null,
        purchased_from: null,
        status: "active",
        notes: null,
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

      {/* Common name — 20px gap */}
      <div className="mt-5">
        <UnderlineField label="common name" focused={focusedField === "common_name"}>
          <input
            type="text"
            value={commonName}
            onChange={(e) => setCommonName(e.target.value)}
            onFocus={() => setFocusedField("common_name")}
            onBlur={(e) => { setFocusedField(null); setCommonName(e.target.value.trim()); }}
            className={`${inputCls} font-sans text-[18px]`}
          />
        </UnderlineField>
      </div>

      {/* Sun needs — 20px gap */}
      <div className="mt-5">
        <p className="font-display italic text-[15px] font-normal text-ink-soft mb-3">sun needs</p>
        <div className="grid grid-cols-2 gap-3">
          {SUN_OPTIONS.map((option, i) => (
            <SunTile
              key={option}
              option={option}
              icon={SUN_ICONS[i]}
              selected={sunNeeds === option}
              onSelect={() => setSunNeeds(sunNeeds === option ? "" : option)}
            />
          ))}
        </div>
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
