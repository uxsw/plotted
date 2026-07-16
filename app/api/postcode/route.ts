import { NextResponse } from "next/server";

// Full UK postcode: 1-2 letters, 1-2 digits/alpha, space (optional), digit, 2 letters.
// Matches "SW1A 2AA", "sw1a2aa", "M1 1AE", etc. Rejects partial outward codes.
const UK_POSTCODE_RE = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i;

type PostcodesIoResult = {
  latitude: number;
  longitude: number;
  admin_district: string | null;
  parish: string | null;
};

function composeLabel(r: PostcodesIoResult): string {
  const district = r.admin_district ?? "";
  const first = r.parish ?? district;
  return first && first !== district ? `${first}, ${district}` : district;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!UK_POSTCODE_RE.test(q)) {
    return NextResponse.json({ result: null });
  }

  const encoded = encodeURIComponent(q.toUpperCase().replace(/\s+/g, ""));
  let res: Response;
  try {
    res = await fetch(`https://api.postcodes.io/postcodes/${encoded}`, {
      next: { revalidate: 86400 },
    });
  } catch {
    return NextResponse.json({ result: null });
  }

  if (!res.ok) {
    return NextResponse.json({ result: null });
  }

  const json = await res.json();
  const r: PostcodesIoResult = json.result;

  if (!r?.latitude || !r?.longitude) {
    return NextResponse.json({ result: null });
  }

  return NextResponse.json({
    result: {
      latitude: r.latitude,
      longitude: r.longitude,
      label: composeLabel(r),
    },
  });
}
