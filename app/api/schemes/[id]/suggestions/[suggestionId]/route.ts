import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; suggestionId: string }> }
) {
  const { id, suggestionId } = await params;

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

  if (typeof body !== "object" || body === null || typeof (body as Record<string, unknown>).saved !== "boolean") {
    return NextResponse.json({ error: "saved must be a boolean" }, { status: 400 });
  }
  const saved = (body as Record<string, unknown>).saved as boolean;

  // Ownership is enforced by RLS (scheme_suggestions policies join through schemes.user_id),
  // but scoping to scheme_id here too keeps a mismatched scheme/suggestion pair from silently no-opping.
  const { data: scheme } = await supabase
    .from("schemes")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!scheme) return NextResponse.json({ error: "Scheme not found" }, { status: 404 });

  const { error } = await supabase
    .from("scheme_suggestions")
    .update({ saved })
    .eq("id", suggestionId)
    .eq("scheme_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
