import { createClient } from "@/lib/supabase/client";
import { hashBlob } from "@/lib/resize";

const UPLOAD_FAILED_MESSAGE = "Photo upload failed. Please try again.";

// Uploads a resized photo Blob directly to Supabase Storage via a signed
// URL — bypassing the Next.js/Vercel function's request body for the binary
// payload — then hands off to /api/upload/finalize for EXIF stripping and
// integrity verification. Returns the final public photo_url, or throws
// with a user-facing message on any failure.
export async function uploadPlantPhoto(blob: Blob): Promise<string> {
  const signRes = await fetch("/api/upload", { method: "POST" });
  const signJson = await signRes.json();
  if (!signRes.ok) throw new Error(signJson.error ?? UPLOAD_FAILED_MESSAGE);

  const { token, path } = signJson as { token: string; path: string };

  const supabase = createClient();
  const { error: uploadError } = await supabase.storage
    .from("plant-photos")
    .uploadToSignedUrl(path, token, blob, { contentType: "image/jpeg" });
  if (uploadError) throw new Error(UPLOAD_FAILED_MESSAGE);

  const fileHash = await hashBlob(blob);
  const finalizeRes = await fetch("/api/upload/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, fileHash }),
  });
  const finalizeJson = await finalizeRes.json();
  if (!finalizeRes.ok) throw new Error(finalizeJson.error ?? UPLOAD_FAILED_MESSAGE);

  return finalizeJson.url as string;
}
