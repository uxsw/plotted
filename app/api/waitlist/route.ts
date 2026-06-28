import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// SUPABASE_SERVICE_ROLE_KEY must be added to Vercel environment variables (John to do manually).
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.email !== "string" || !EMAIL_RE.test(body.email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const garden_notes = typeof body.garden_notes === "string"
    ? body.garden_notes.trim().slice(0, 2000) || null
    : null;

  const supabase = serviceClient();
  const { error } = await supabase.from("waitlist").insert({ email, garden_notes });

  if (error) {
    // Unique violation — email already on the waitlist; don't reveal this.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true });
    }
    console.error("Waitlist insert error:", error);
    return NextResponse.json({ error: "Something went wrong — please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
