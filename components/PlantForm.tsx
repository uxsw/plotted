"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { PlantInsert, SunNeeds } from "@/lib/types";
import { upsertPlant } from "@/app/actions/plants";
import type { FieldErrors } from "@/lib/validation";
import {
  ACCEPTED_INPUT_TYPES,
  ACCEPTED_INPUT_TYPES_LABEL,
  MAX_ORIGINAL_SIZE,
  MAX_ORIGINAL_SIZE_LABEL,
} from "@/lib/upload";

const SUN_OPTIONS: SunNeeds[] = ["full sun", "full sun / partial shade", "partial shade", "full shade"];
const MAX_PX = 800;
const JPEG_QUALITY = 0.85;

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

export default function PlantForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [species, setSpecies] = useState("");
  const [cultivar, setCultivar] = useState("");
  const [commonName, setCommonName] = useState("");
  const [sunNeeds, setSunNeeds] = useState<SunNeeds | "">("");

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

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6 max-w-2xl">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

      {/* Photo upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
        <div
          onClick={() => fileRef.current?.click()}
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
        <input type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} className="hidden" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Species <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            onBlur={(e) => setSpecies(e.target.value.trim())}
            placeholder="e.g. canina"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {fieldErrors.species && <p className="text-xs text-red-600 mt-1">{fieldErrors.species}</p>}
        </div>

        <div>
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

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Common name</label>
          <input
            type="text"
            value={commonName}
            onChange={(e) => setCommonName(e.target.value)}
            onBlur={(e) => setCommonName(e.target.value.trim())}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="sm:col-span-2">
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
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="bg-green-700 text-white px-5 py-2 rounded text-sm font-medium hover:bg-green-800 disabled:opacity-50"
        >
          {saving || uploading ? "Saving…" : "Add plant"}
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
