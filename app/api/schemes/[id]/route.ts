import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: scheme, error: schemeError } = await supabase
    .from("schemes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (schemeError || !scheme) {
    return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
  }

  const [{ data: sourcePlants }, { data: suggestions }] = await Promise.all([
    supabase
      .from("scheme_source_plants")
      .select("id, plant_id, sort_order, plants (*)")
      .eq("scheme_id", id)
      .order("sort_order"),
    supabase
      .from("scheme_suggestions")
      .select("*")
      .eq("scheme_id", id)
      .order("sort_order"),
  ]);

  return NextResponse.json({
    scheme,
    source_plants: sourcePlants ?? [],
    suggestions: suggestions ?? [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || typeof (body as Record<string, unknown>).name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const name = (body as Record<string, unknown>).name as string;
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 200) {
    return NextResponse.json({ error: "name must be between 1 and 200 characters" }, { status: 400 });
  }

  const { error } = await supabase
    .from("schemes")
    .update({ name: trimmed })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // scheme_source_plants and scheme_suggestions cascade on delete via their FK to schemes.
  const { error } = await supabase
    .from("schemes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
