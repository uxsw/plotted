import { NextResponse } from "next/server";

// Full UK postcode: 1-2 letters, 1-2 digits/alpha, space (optional), digit, 2 letters.
// Matches "SW1A 2AA", "sw1a2aa", "M1 1AE", etc. Rejects partial outward codes.
const UK_POSTCODE_RE = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i;

type PostcodesIoResult = {
  latitude: number;
  longitude: number;
  admin_district: string | null;
  admin_county: string | null;
  admin_ward: string | null;
  parish: string | null;
  region: string | null;
};

function dedupe(first: string, second: string | null): string {
  if (!second) return first;
  if (second.trim().toLowerCase() === first.trim().toLowerCase()) return first;
  return `${first}, ${second}`;
}

function isRealParish(parish: string | null): parish is string {
  return parish != null && !parish.toLowerCase().includes("unparished area");
}

function composeLabel(r: PostcodesIoResult): string {
  if (isRealParish(r.parish)) {
    // Rural/suburban with a named civil parish: "Woodbury, East Devon"
    return dedupe(r.parish, r.admin_district);
  }
  if (r.admin_county) {
    // City/town with a county: "Exeter, Devon"
    return dedupe(r.admin_district ?? r.admin_county, r.admin_county);
  }
  // London borough or unitary authority (no admin_county): "West Hampstead, London"
  return dedupe(r.admin_ward ?? r.admin_district ?? "", r.region);
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
