"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Plant, PlantInsert, SunNeeds } from "@/lib/types";
import { upsertPlant } from "@/app/actions/plants";
import type { FieldErrors } from "@/lib/validation";
import {
  ACCEPTED_INPUT_TYPES,
  ACCEPTED_INPUT_TYPES_LABEL,
  MAX_ORIGINAL_SIZE,
  MAX_ORIGINAL_SIZE_LABEL,
} from "@/lib/upload";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SUN_OPTIONS: SunNeeds[] = ["full sun", "partial shade", "full shade"];
const MAX_PX = 800;
const JPEG_QUALITY = 0.85;

interface Props {
  plant?: Plant;
}

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

export default function PlantForm({ plant }: Props) {
  const router = useRouter();
  const isEdit = !!plant;
  const fileRef = useRef<HTMLInputElement>(null);

  const now = new Date();
  const [commonName, setCommonName] = useState(plant?.common_name ?? "");
  const [genus, setGenus] = useState(plant?.genus ?? "");
  const [species, setSpecies] = useState(plant?.species ?? "");
  const [cultivar, setCultivar] = useState(plant?.cultivar ?? "");
  const [location, setLocation] = useState(plant?.location ?? "");
  const [sunNeeds, setSunNeeds] = useState<SunNeeds | "">(plant?.sun_needs ?? "");
  const [purchasedFrom, setPurchasedFrom] = useState(plant?.purchased_from ?? "");
  const [notes, setNotes] = useState(plant?.notes ?? "");
  const [heightCm, setHeightCm] = useState(plant?.eventual_height_cm?.toString() ?? "");
  const [spreadCm, setSpreadCm] = useState(plant?.eventual_spread_cm?.toString() ?? "");
  const [flowerFrom, setFlowerFrom] = useState(plant?.flowering_season_from?.toString() ?? "");
  const [flowerTo, setFlowerTo] = useState(plant?.flowering_season_to?.toString() ?? "");

  const initialDate = plant?.date_planted ? new Date(plant.date_planted) : null;
  const [plantedMonth, setPlantedMonth] = useState(
    initialDate ? String(initialDate.getUTCMonth() + 1) : String(now.getMonth() + 1)
  );
  const [plantedYear, setPlantedYear] = useState(
    initialDate ? String(initialDate.getUTCFullYear()) : String(now.getFullYear())
  );

  const [photoPreview, setPhotoPreview] = useState<string | null>(plant?.photo_url ?? null);
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

  function handleDropZoneClick() {
    fileRef.current?.click();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const fakeEvent = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileChange(fakeEvent);
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoBlob) return plant?.photo_url ?? null;
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
        genus,
        species: species || null,
        cultivar: cultivar || null,
        date_planted: `${plantedYear}-${plantedMonth.padStart(2, "0")}-01`,
        photo_url: photoUrl,
        location: location.trim() || null,
        sun_needs: sunNeeds || null,
        flowering_season_from: flowerFrom ? parseInt(flowerFrom) : null,
        flowering_season_to: flowerTo ? parseInt(flowerTo) : null,
        eventual_height_cm: heightCm ? parseInt(heightCm) : null,
        eventual_spread_cm: spreadCm ? parseInt(spreadCm) : null,
        purchased_from: purchasedFrom.trim() || null,
        status: plant?.status ?? "active",
        notes: notes.trim() || null,
      };

      const result = await upsertPlant(isEdit ? plant.id : null, payload);
      if (!result) return; // redirect() handled navigation server-side
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

  const yearOptions = Array.from({ length: 30 }, (_, i) => now.getFullYear() - i);

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6 max-w-2xl">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

      {/* Photo upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
        <div
          onClick={handleDropZoneClick}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-green-500 transition-colors"
        >
          {photoPreview ? (
            <div className="relative w-full h-56">
              <Image src={photoPreview} alt="Preview" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-medium">Click to change photo</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
              <span className="text-3xl">📷</span>
              <span className="text-sm">Click to upload a photo</span>
              <span className="text-xs">or drag and drop</span>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Core fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Common name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={commonName}
            onChange={(e) => setCommonName(e.target.value)}
            onBlur={(e) => setCommonName(e.target.value.trim())}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Genus <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={genus}
            onChange={(e) => setGenus(e.target.value)}
            onBlur={(e) => setGenus(e.target.value.trim())}
            placeholder="e.g. Rosa"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {fieldErrors.genus && <p className="text-xs text-red-600 mt-1">{fieldErrors.genus}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
          <input
            type="text"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            onBlur={(e) => setSpecies(e.target.value.trim())}
            placeholder="e.g. canina"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cultivar</label>
          <input
            type="text"
            value={cultivar}
            onChange={(e) => setCultivar(e.target.value)}
            onBlur={(e) => setCultivar(e.target.value.trim())}
            placeholder="e.g. Royal Bumble"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Month planted</label>
          <select
            value={plantedMonth}
            onChange={(e) => setPlantedMonth(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year planted</label>
          <select
            value={plantedYear}
            onChange={(e) => setPlantedYear(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {yearOptions.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          {fieldErrors.date_planted && <p className="text-xs text-red-600 mt-1">{fieldErrors.date_planted}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. back bed, patio pot"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sun needs</label>
          <select
            value={sunNeeds}
            onChange={(e) => setSunNeeds(e.target.value as SunNeeds | "")}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">— select —</option>
            {SUN_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Flowering from</label>
          <select
            value={flowerFrom}
            onChange={(e) => setFlowerFrom(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">— select —</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>{m}</option>
            ))}
          </select>
          {fieldErrors.flowering_season_from && <p className="text-xs text-red-600 mt-1">{fieldErrors.flowering_season_from}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Flowering to</label>
          <select
            value={flowerTo}
            onChange={(e) => setFlowerTo(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">— select —</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>{m}</option>
            ))}
          </select>
          {fieldErrors.flowering_season_to && <p className="text-xs text-red-600 mt-1">{fieldErrors.flowering_season_to}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Height at maturity (cm)</label>
          <input
            type="number"
            min={1}
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {fieldErrors.eventual_height_cm && <p className="text-xs text-red-600 mt-1">{fieldErrors.eventual_height_cm}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Spread at maturity (cm)</label>
          <input
            type="number"
            min={1}
            value={spreadCm}
            onChange={(e) => setSpreadCm(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {fieldErrors.eventual_spread_cm && <p className="text-xs text-red-600 mt-1">{fieldErrors.eventual_spread_cm}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchased from</label>
          <input
            type="text"
            value={purchasedFrom}
            onChange={(e) => setPurchasedFrom(e.target.value)}
            placeholder="Nursery or shop name"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="bg-green-700 text-white px-5 py-2 rounded text-sm font-medium hover:bg-green-800 disabled:opacity-50"
        >
          {saving || uploading ? "Saving…" : isEdit ? "Save changes" : "Add plant"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 rounded text-sm text-gray-600 border border-gray-300 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
