import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ACCEPTED_UPLOAD_TYPES, MAX_UPLOAD_SIZE, MAX_UPLOAD_SIZE_LABEL } from "@/lib/upload";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!(ACCEPTED_UPLOAD_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type "${file.type}". Accepted: ${ACCEPTED_UPLOAD_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { error: `File too large. Maximum size after processing is ${MAX_UPLOAD_SIZE_LABEL}.` },
      { status: 400 }
    );
  }

  const path = `${user.id}/${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("plant-photos")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("plant-photos").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
