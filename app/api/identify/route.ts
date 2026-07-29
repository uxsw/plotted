import { NextRequest, NextResponse } from "next/server";
import { createClient, createBearerClient } from "@/lib/supabase/server";
import {
  getIdentificationAdapter,
  IdentificationProviderError,
  IdentificationTimeoutError,
  IdentificationLimitError,
} from "@/lib/identification";
import { stripExif } from "@/lib/identification/exif";
import { enforceDailyIdentifyLimit } from "@/lib/identification/dailyLimit";
import { ACCEPTED_UPLOAD_TYPES, MAX_ORIGINAL_SIZE, MAX_ORIGINAL_SIZE_LABEL } from "@/lib/upload";

export async function POST(request: NextRequest) {
  // Cookie auth is the normal browser path. Bearer token is an additional,
  // scriptable fallback (diagnostic scripts, no cookie jar available) — it
  // does not replace or weaken the cookie check below.
  const bearerToken = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];

  const supabase = bearerToken ? createBearerClient(bearerToken) : await createClient();
  const {
    data: { user },
  } = bearerToken ? await supabase.auth.getUser(bearerToken) : await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await enforceDailyIdentifyLimit(supabase, user.id);
  } catch (err) {
    if (err instanceof IdentificationLimitError) {
      return NextResponse.json({ error: "daily_limit_reached" }, { status: 429 });
    }
    throw err;
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  if (!(ACCEPTED_UPLOAD_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type "${file.type}". Accepted: ${ACCEPTED_UPLOAD_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (file.size > MAX_ORIGINAL_SIZE) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_ORIGINAL_SIZE_LABEL}.` },
      { status: 400 }
    );
  }

  const original = Buffer.from(await file.arrayBuffer());

  let stripped: Buffer;
  try {
    stripped = await stripExif(original);
  } catch {
    return NextResponse.json({ error: "Could not process image" }, { status: 400 });
  }

  const { data: garden } = await supabase
    .from("garden")
    .select("latitude, longitude")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const region =
    garden?.latitude != null && garden?.longitude != null
      ? { latitude: garden.latitude, longitude: garden.longitude }
      : null;

  try {
    const adapter = getIdentificationAdapter();
    const result = await adapter.identify(stripped, region);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof IdentificationTimeoutError) {
      return NextResponse.json({ error: "timeout" }, { status: 504 });
    }
    if (err instanceof IdentificationProviderError) {
      console.error("[identify] provider error:", err.message);
      return NextResponse.json({ error: "provider_error" }, { status: 502 });
    }
    console.error("[identify] unexpected error:", err);
    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }
}
