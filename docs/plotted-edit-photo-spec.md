# Plotted — Edit Plant Photo
*Spec for Claude Code — low effort*

---

## Overview

The plant photo currently cannot be changed after a plant is created. Add the ability to replace the photo from the plant detail page.

---

## Behaviour

- Tapping the existing photo opens the device file picker (image files only)
- On file selection: upload the new image to Supabase Storage, update `photo_url` on the plant record, display the new photo
- The old image should be deleted from Supabase Storage after the new one is successfully uploaded — do not leave orphaned files
- On upload error: show an inline error message, leave the existing photo unchanged
- While uploading: show a loading state over the photo (subtle overlay or opacity reduction + spinner) — the photo area should not collapse or shift layout

## No-photo state

- If a plant has no photo, the existing empty photo zone (moss-tint background, dashed border, sprout icon) should also be tappable to trigger the file picker — same behaviour, same upload logic
- This means the "add photo" affordance on the detail page is consistent whether the plant has a photo or not

---

## UI

- No explicit "edit" button needed — tapping the photo itself is the affordance
- On hover (desktop): subtle moss-tint overlay with a camera or edit icon centred over the photo to indicate it is tappable
- The hover overlay should not affect the photo's border-radius or layout
- On mobile, tap directly triggers the file picker — no hover state needed

---

## Validation

- Apply the same image upload constraints already in place (file type, file size limits) — do not duplicate logic, reuse existing validation
- Server-side validation should match what is already implemented for the initial photo upload on plant creation

---

## Storage

- Use the same Supabase Storage bucket and path conventions as the existing photo upload
- Generate a new unique filename for the replacement image — do not reuse the old filename (cache busting)
- Delete the old file from Storage only after the new upload has succeeded

---

## Future note (no action required)

The current single `photo_url` column on `plants` will eventually be superseded by a `plant_photos` table when multi-photo support is added. Do not refactor toward that now — keep this change minimal and self-contained.

---

## Out of scope

- Multiple photo upload
- Photo cropping or editing
- Any changes to the add plant short form photo behaviour
