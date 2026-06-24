import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Feature flag check
  const { data: flags } = await supabase
    .from("user_flags")
    .select("ai_lookup_enabled")
    .eq("user_id", user.id)
    .single();

  if (!flags?.ai_lookup_enabled) {
    return NextResponse.json({ error: "Feature not available" }, { status: 403 });
  }

  // Fetch plant — RLS ensures it belongs to the authenticated user
  const { data: plant } = await supabase
    .from("plants")
    .select("species, cultivar")
    .eq("id", id)
    .single();

  if (!plant) {
    return NextResponse.json({ error: "Plant not found" }, { status: 404 });
  }

  if (!plant.species) {
    return NextResponse.json({ commonNames: [] });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `You are a botanical reference assistant. Given a plant's scientific species name and optional cultivar, return a list of common names used in the United Kingdom.

Species: ${plant.species}
Cultivar: ${plant.cultivar ?? ""} (may be empty)

Return ONLY a JSON array of strings, no preamble, no markdown, no explanation. If no common names are known, return an empty array []. Example: ["Foxglove", "Fairy Fingers"]`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const commonNames: unknown = JSON.parse(text);

    if (!Array.isArray(commonNames) || !commonNames.every((n) => typeof n === "string")) {
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }

    return NextResponse.json({ commonNames });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
