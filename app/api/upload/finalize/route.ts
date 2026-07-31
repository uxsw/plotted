import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripExif } from "@/lib/identification/exif";

const UPLOAD_FAILED_MESSAGE = "Photo upload failed. Please try again.";

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function hexSample(buffer: Buffer, length = 32): string {
  return buffer.subarray(0, length).toString("hex");
}

// Counts occurrences of the raw UTF-8 replacement-character byte sequence
// (EF BF BD) — the fingerprint from the original corruption investigation.
// TEMPORARY forensic instrumentation: remove once the root cause behind
// these mismatches is confirmed.
function countReplacementChar(buffer: Buffer): number {
  let count = 0;
  for (let i = 0; i <= buffer.length - 3; i++) {
    if (buffer[i] === 0xef && buffer[i + 1] === 0xbf && buffer[i + 2] === 0xbd) count++;
  }
  return count;
}

// Preserves mismatched bytes at a debug path (nested under the user's own
// folder — storage RLS requires the first path segment to equal auth.uid())
// and logs a detailed comparison instead of deleting outright, so a real
// mismatch can be inspected before cleanup.
async function captureDebugMismatch(
  supabase: SupabaseClient,
  userId: string,
  stage: "receipt" | "post-write",
  path: string,
  expectedHash: string,
  actual: Buffer,
  writtenForCompare: Buffer
) {
  const debugPath = `${userId}/_debug/${stage}-${Date.now()}.jpg`;
  const { error: debugUploadError } = await supabase.storage
    .from("plant-photos")
    .upload(debugPath, actual, { contentType: "image/jpeg", upsert: true });

  console.error(`upload-finalize: ${stage} hash mismatch`, {
    path,
    debugPath,
    debugUploadError: debugUploadError?.message ?? null,
    expectedSize: writtenForCompare.length,
    actualSize: actual.length,
    expectedHash,
    actualHash: sha256(actual),
    expectedSample: hexSample(writtenForCompare),
    actualSample: hexSample(actual),
    replacementCharCount: countReplacementChar(actual),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Storage RLS here grants insert (and public select) but not delete — a
  // delete under the session-scoped client doesn't error, it silently
  // matches zero rows (RLS filters rows out rather than rejecting the
  // statement), so cleanup would leak objects forever without this. Reads
  // and writes below still go through the user-scoped `supabase` client;
  // only removal uses the service role.
  const storageAdmin = createServiceClient().storage.from("plant-photos");

  let body: { path?: string; fileHash?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { path: rawPath, fileHash } = body;
  // Must be exactly the shape app/api/upload/route.ts hands out — a fresh
  // timestamped file directly under the user's own "_raw" holding folder —
  // not just "starts with the user's id", so this endpoint can't be pointed
  // at an arbitrary existing object.
  const rawPathPattern = new RegExp(`^${user.id}/_raw/\\d+\\.jpg$`);
  if (typeof rawPath !== "string" || !rawPathPattern.test(rawPath) || typeof fileHash !== "string" || !fileHash) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // The final path is a sibling of the raw one, not an overwrite of it —
  // storage RLS here only grants insert to the session-scoped client, so
  // this step can't just overwrite rawPath once stripExif has re-encoded it.
  const finalPath = rawPath.replace("/_raw/", "/");

  // Receipt check: fetch what the client's direct-to-Storage upload actually
  // landed, and compare against the hash it computed before uploading. This
  // is the new diagnostic value of this flow — it validates the signed-URL
  // upload leg independently of anything this Vercel function's body parser
  // does, since that leg never touches this function at all.
  const { data: uploaded, error: fetchError } = await supabase.storage.from("plant-photos").download(rawPath);
  if (fetchError || !uploaded) {
    console.error("upload-finalize: could not fetch uploaded object", { rawPath, error: fetchError?.message });
    return NextResponse.json({ error: UPLOAD_FAILED_MESSAGE }, { status: 400 });
  }

  const received = Buffer.from(await uploaded.arrayBuffer());
  const receivedHash = sha256(received);

  if (receivedHash !== fileHash) {
    await captureDebugMismatch(supabase, user.id, "receipt", rawPath, fileHash, received, received);
    await storageAdmin.remove([rawPath]);
    return NextResponse.json({ error: UPLOAD_FAILED_MESSAGE }, { status: 400 });
  }

  let stripped: Buffer;
  try {
    stripped = await stripExif(received);
  } catch {
    await storageAdmin.remove([rawPath]);
    return NextResponse.json({ error: "Could not process image" }, { status: 400 });
  }

  // Baseline to verify against after the round-trip through Storage —
  // stripExif re-encodes the bytes, so this (not fileHash) is what a correct
  // write to finalPath must match.
  const writtenHash = sha256(stripped);

  const { error: uploadError } = await supabase.storage
    .from("plant-photos")
    .upload(finalPath, stripped, { contentType: "image/jpeg" });

  if (uploadError) {
    await storageAdmin.remove([rawPath]);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Read the just-written object back and verify it landed intact before
  // handing the URL back — otherwise a corrupted write would silently save
  // a broken photo_url.
  const { data: downloaded, error: downloadError } = await supabase.storage
    .from("plant-photos")
    .download(finalPath);

  if (downloadError || !downloaded) {
    console.error("upload-finalize: read-back failed", { finalPath, error: downloadError?.message });
    await storageAdmin.remove([rawPath, finalPath]);
    return NextResponse.json({ error: UPLOAD_FAILED_MESSAGE }, { status: 500 });
  }

  const downloadedBuffer = Buffer.from(await downloaded.arrayBuffer());
  const downloadedHash = sha256(downloadedBuffer);

  if (downloadedHash !== writtenHash) {
    await captureDebugMismatch(supabase, user.id, "post-write", finalPath, writtenHash, downloadedBuffer, stripped);
    await storageAdmin.remove([rawPath, finalPath]);
    return NextResponse.json({ error: UPLOAD_FAILED_MESSAGE }, { status: 500 });
  }

  // Best-effort cleanup of the raw holding object — not fatal if it fails,
  // the user-facing result no longer depends on it.
  const { error: rawRemoveError } = await storageAdmin.remove([rawPath]);
  if (rawRemoveError) {
    console.error("upload-finalize: failed to clean up raw object", { rawPath, error: rawRemoveError.message });
  }

  const { data } = supabase.storage.from("plant-photos").getPublicUrl(finalPath);
  return NextResponse.json({ url: data.publicUrl });
}
