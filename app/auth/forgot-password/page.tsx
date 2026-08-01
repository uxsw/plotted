"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";

function UnderlineField({ label, focused, children }: {
  label: string;
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="brevier">
        {label}
      </label>
      <div className="relative">
        {children}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-sand-line" />
        <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-moss transition-transform duration-200 ease-out origin-left ${focused ? "scale-x-100" : "scale-x-0"}`} />
      </div>
    </div>
  );
}

function Illustration() {
  return (
    <svg width="200" height="220" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="196" rx="50" ry="5" fill="#E8DFC8"/>
      <path d="M100 194 C100 170 100 140 100 80" stroke="#4F6B4A" strokeWidth="2" strokeLinecap="round"/>
      <path d="M100 160 C100 160 74 152 70 132 C70 132 94 130 100 152" stroke="#4F6B4A" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
      <path d="M100 152 C90 146 78 140 72 134" stroke="#4F6B4A" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
      <path d="M100 140 C100 140 126 132 130 112 C130 112 106 110 100 132" stroke="#4F6B4A" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
      <path d="M100 132 C112 126 122 118 129 114" stroke="#4F6B4A" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
      <path d="M100 80 C96 68 96 58 100 50 C104 58 104 68 100 80Z" stroke="#4F6B4A" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
      <path d="M100 50 C94 42 88 36 86 28 C94 28 100 34 100 42" stroke="#4F6B4A" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
      <path d="M100 50 C106 42 112 36 114 28 C106 28 100 34 100 42" stroke="#4F6B4A" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
      <circle cx="100" cy="22" r="8" stroke="#4F6B4A" strokeWidth="1.5" fill="none"/>
      <circle cx="100" cy="22" r="3" fill="#C99A3D"/>
      <path d="M100 14 C98 10 96 6 100 2 C104 6 102 10 100 14" stroke="#4F6B4A" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
      <path d="M108 18 C112 16 116 12 120 14 C118 18 114 20 110 18" stroke="#4F6B4A" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
      <path d="M92 18 C88 16 84 12 80 14 C82 18 86 20 90 18" stroke="#4F6B4A" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
      <path d="M106 28 C108 24 114 22 118 24 C116 28 110 30 106 28" stroke="#4F6B4A" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
      <path d="M94 28 C92 24 86 22 82 24 C84 28 90 30 94 28" stroke="#4F6B4A" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
      <path d="M100 194 C93 194 87 200 80 203" stroke="#4F6B4A" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
      <path d="M100 194 C107 194 113 200 120 203" stroke="#4F6B4A" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "recovery",
    });
    if (verifyError) {
      setError("That code is invalid or has expired.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-[500px] flex flex-col items-center">

        <div className="pt-8 pb-5">
          <Illustration />
        </div>

        <h1 className="paragon">Plotted</h1>
        <p className="primer">Find your way back</p>

        {!sent ? (
          <form onSubmit={handleRequestCode} className="w-full flex flex-col">
            {error && (
              <p className="font-display italic text-[14px] text-[#C2603C] mb-4">{error}</p>
            )}

            <UnderlineField label="email" focused={focusedField === "email"}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                className="o-text-input__underline"
              />
            </UnderlineField>

            <div className="mt-8">
              <Button type="submit" disabled={loading} className="w-full justify-center">
                {loading ? "Sending…" : "Send reset code"}
              </Button>
            </div>

            <div className="flex justify-center mt-6">
              <Link
                href="/auth/login"
                className={clsx(
                  buttonStyles["o-button"],
                  buttonStyles["o-button--ghost"]
                )}>
                Back to sign in
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="w-full flex flex-col">
            <p className="primer mb-6">
              Enter the code we sent to {email} along with your new password.
            </p>

            {error && (
              <p className="font-display italic text-[14px] text-[#C2603C] mb-4">{error}</p>
            )}

            <UnderlineField label="code" focused={focusedField === "code"}>
              <input
                type="text"
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onFocus={() => setFocusedField("code")}
                onBlur={() => setFocusedField(null)}
                className="o-text-input__underline"
              />
            </UnderlineField>

            <div className="mt-6">
              <UnderlineField label="new password" focused={focusedField === "newPassword"}>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={() => setFocusedField("newPassword")}
                  onBlur={() => setFocusedField(null)}
                  className="o-text-input__underline"
                />
              </UnderlineField>
            </div>

            <div className="mt-6">
              <UnderlineField label="confirm password" focused={focusedField === "confirmPassword"}>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  className="o-text-input__underline"
                />
              </UnderlineField>
            </div>

            <div className="mt-8">
              <Button type="submit" disabled={loading} className="w-full justify-center">
                {loading ? "Updating…" : "Update password"}
              </Button>
            </div>

            <div className="flex justify-center mt-6">
              <Link
                href="/auth/login"
                className={clsx(
                  buttonStyles["o-button"],
                  buttonStyles["o-button--ghost"]
                )}>
                Back to sign in
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
