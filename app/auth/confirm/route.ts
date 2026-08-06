import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Recovery has its own OTP flow (see app/auth/forgot-password) — deliberately excluded here.
const CONFIRMABLE_TYPES = ["signup", "invite", "email_change", "magiclink"] as const;
type ConfirmableType = (typeof CONFIRMABLE_TYPES)[number];

function isConfirmableType(type: string | null): type is ConfirmableType {
  return CONFIRMABLE_TYPES.includes(type as ConfirmableType);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (tokenHash && isConfirmableType(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (!error) {
      const destination = type === "signup" || type === "invite" ? "/welcome" : "/dashboard";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=confirmation_failed`);
}
