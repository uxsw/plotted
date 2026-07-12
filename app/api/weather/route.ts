import { NextRequest, NextResponse } from "next/server";
import { fetchForecast } from "@/lib/weather";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  try {
    const data = await fetchForecast(lat, lng);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[weather] forecast fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch forecast" }, { status: 502 });
  }
}
