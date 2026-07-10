import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AddBody = {
  schemeId: string;
  species: string;
  commonNames: string[];
  wikimediaImageUrl: string | null;
  wikimediaAttribution: string | null;
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: AddBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { schemeId, species, commonNames, wikimediaImageUrl, wikimediaAttribution } = body;
  if (!schemeId || !species) {
    return NextResponse.json({ error: "schemeId and species are required" }, { status: 400 });
  }

  // Duplicate check: same user, scheme, and species is treated as the same item.
  const { data: existing } = await supabase
    .from("shopping_list_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("scheme_id", schemeId)
    .eq("species", species)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, alreadyExists: true });
  }

  // Snapshot the image into storage. If wikimediaImageUrl is absent (suggestion
  // had no Wikimedia image) we store an empty path and the shopping list page
  // renders a placeholder. If the fetch/upload fails we surface an error rather
  // than inserting a row with no thumbnail.
  let thumbnailStoragePath = "";

  if (wikimediaImageUrl) {
    let imageBuffer: ArrayBuffer;
    let contentType: string;
    try {
      const imageRes = await fetch(wikimediaImageUrl);
      if (!imageRes.ok) throw new Error(`Image fetch returned ${imageRes.status}`);
      imageBuffer = await imageRes.arrayBuffer();
      contentType = imageRes.headers.get("content-type") ?? "image/jpeg";
    } catch (err) {
      console.error("[shopping-list] image fetch failed:", err);
      return NextResponse.json(
        { error: "Couldn't snapshot the plant image — please try again." },
        { status: 502 }
      );
    }

    const ext = contentType.includes("png") ? "png" : "jpg";
    const storagePath = `${user.id}/shopping-list/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("plant-photos")
      .upload(storagePath, imageBuffer, { contentType, upsert: false });

    if (uploadError) {
      console.error("[shopping-list] storage upload failed:", uploadError);
      return NextResponse.json(
        { error: "Couldn't save the plant image — please try again." },
        { status: 500 }
      );
    }

    thumbnailStoragePath = storagePath;
  }

  const { error: insertError } = await supabase.from("shopping_list_items").insert({
    user_id: user.id,
    scheme_id: schemeId,
    species,
    cultivar: null,
    common_names: commonNames,
    thumbnail_storage_path: thumbnailStoragePath,
    wikimedia_attribution: wikimediaAttribution,
  });

  if (insertError) {
    console.error("[shopping-list] insert failed:", insertError);
    return NextResponse.json({ error: "Couldn't add to shopping list — please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
