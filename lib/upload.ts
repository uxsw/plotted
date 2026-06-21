// Types the user may select (pre-resize). HEIC/HEIF are accepted because the
// canvas resize step converts them to JPEG on browsers that support HEIC in
// canvas (iOS/macOS Safari). On Chrome/Firefox desktop, HEIC files fail at
// canvas load and the user sees "Could not process image." — acceptable
// since iPhone is the primary source of HEIC files and Safari handles it.
export const ACCEPTED_INPUT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

// Types accepted by the upload API route (post-resize). Canvas always outputs
// JPEG, so in practice the server only ever receives image/jpeg. PNG and WebP
// are listed defensively in case the resize step changes in future.
export const ACCEPTED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

// 10MB guard on the original file before resize. Anything larger is almost
// certainly wrong (e.g. a video or raw camera file).
export const MAX_ORIGINAL_SIZE = 10 * 1024 * 1024;
export const MAX_ORIGINAL_SIZE_LABEL = "10MB";

// 5MB guard on the resized blob. Must not exceed the Supabase bucket limit,
// which is configured to 5MB in the dashboard (Storage → plant-photos →
// Configuration). After canvas resize to 800px JPEG at 85% quality, uploaded
// files are typically 50–500KB, so this is generous headroom.
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
export const MAX_UPLOAD_SIZE_LABEL = "5MB";

// Human-readable label for the file picker's accept attribute and error messages
export const ACCEPTED_INPUT_TYPES_LABEL = "JPEG, PNG, WebP, or HEIC";
