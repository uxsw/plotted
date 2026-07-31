import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Issues a signed upload URL so the browser can PUT the file bytes straight
// to Supabase Storage — bypassing this Vercel function's request body for
// the actual binary payload. See app/api/upload/finalize/route.ts for the
// EXIF-strip + integrity-verify step that runs after the direct upload.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Uploaded to a "_raw" holding path, not the final photo_url path — the
  // finalize step below reads this, strips EXIF, and writes the result to a
  // separate fresh path. Storage RLS here grants insert and delete but not
  // update, so finalize can't just overwrite this same path once it exists.
  const path = `${user.id}/_raw/${Date.now()}.jpg`;
  const { data, error } = await supabase.storage
    .from("plant-photos")
    .createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path: data.path });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.url || typeof body.url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  let storagePath: string;
  try {
    const urlObj = new URL(body.url);
    const prefix = "/storage/v1/object/public/plant-photos/";
    if (!urlObj.pathname.startsWith(prefix)) {
      return NextResponse.json({ error: "Invalid storage URL" }, { status: 400 });
    }
    storagePath = decodeURIComponent(urlObj.pathname.slice(prefix.length));
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Ensure the file belongs to the authenticated user
  if (!storagePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.storage.from("plant-photos").remove([storagePath]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
