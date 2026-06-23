"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

function SprigIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
      <line x1="6" y1="13" x2="6" y2="2" stroke="#C2603C" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M6 9 C6 9 3 8 2 5 C2 5 5 5 6 8Z" stroke="#C2603C" strokeWidth="1" fill="none" strokeLinejoin="round"/>
      <path d="M6 6 C6 6 9 5 10 2 C10 2 7 2 6 5Z" stroke="#C2603C" strokeWidth="1" fill="none" strokeLinejoin="round"/>
    </svg>
  );
}

function UnderlineField({ label, focused, hasError, children }: {
  label: string;
  focused: boolean;
  hasError?: boolean;
  children: React.ReactNode;
}) {
  const labelCls = hasError ? "text-[#C2603C]" : "text-ink-soft";
  const lineCls = hasError
    ? "bg-[#C2603C] scale-x-100"
    : focused
    ? "bg-moss scale-x-100"
    : "bg-moss scale-x-0";

  return (
    <div>
      <label className={`block font-display italic text-[15px] font-normal ${labelCls}`}>
        {label}
      </label>
      <div className="relative">
        {children}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-sand-line" />
        <div className={`absolute bottom-0 left-0 right-0 h-[2px] transition-transform duration-200 ease-out origin-left ${lineCls}`} />
      </div>
    </div>
  );
}

function Illustration() {
  return (
    <svg width="200" height="220" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="196" rx="44" ry="5" fill="#E8DFC8"/>
      <path d="M100 194 C100 178 100 162 100 130" stroke="#4F6B4A" strokeWidth="2" strokeLinecap="round"/>
      <path d="M100 168 C100 168 78 160 74 142 C74 142 96 140 100 160" stroke="#4F6B4A" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
      <path d="M100 160 C90 154 80 148 76 144" stroke="#4F6B4A" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
      <path d="M100 152 C100 152 122 144 126 126 C126 126 104 124 100 144" stroke="#4F6B4A" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
      <path d="M100 144 C110 138 120 130 125 127" stroke="#4F6B4A" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
      <path d="M100 130 C98 118 97 108 100 96 C103 108 102 118 100 130Z" stroke="#4F6B4A" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
      <path d="M100 96 C98 84 97 72 100 60 C103 72 102 84 100 96Z" stroke="#4F6B4A" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
      <path d="M100 60 C99 50 98 42 100 34 C102 42 101 50 100 60Z" stroke="#4F6B4A" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
      <circle cx="100" cy="30" r="4" stroke="#4F6B4A" strokeWidth="1.2" fill="none"/>
      <circle cx="100" cy="30" r="1.5" fill="#C99A3D"/>
      <path d="M100 194 C94 194 89 199 83 202" stroke="#4F6B4A" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
      <path d="M100 194 C106 194 111 199 117 202" stroke="#4F6B4A" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
      <path d="M97 196 C93 200 89 206 86 210" stroke="#4F6B4A" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6"/>
      <path d="M103 196 C107 200 111 206 114 210" stroke="#4F6B4A" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6"/>
    </svg>
  );
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [matchError, setMatchError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMatchError(false);

    if (password !== confirmPassword) {
      setMatchError(true);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-[500px] flex flex-col items-center">

        <div className="pt-8 pb-5">
          <Illustration />
        </div>

        <h1 className="font-display font-medium text-[36px] text-ink text-center mb-[6px]">Plotted</h1>
        <p className="font-display italic text-[15px] font-normal text-ink-soft text-center mb-10">start your garden record</p>

        {success ? (
          <p className="font-display italic text-[15px] font-normal text-ink-soft text-center">
            check your email to confirm your account
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col">
            {error && (
              <div className="flex items-center gap-[7px] mb-4">
                <SprigIcon />
                <span className="font-display italic text-[14px] text-[#C2603C]">{error}</span>
              </div>
            )}

            <UnderlineField label="email" focused={focusedField === "email"}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                className="w-full bg-transparent border-0 outline-none font-sans text-[17px] text-ink pb-3 pt-[10px]"
              />
            </UnderlineField>

            <div className="mt-6">
              <UnderlineField label="password" focused={focusedField === "password"}>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent border-0 outline-none font-sans text-[17px] text-ink pb-3 pt-[10px]"
                />
              </UnderlineField>
            </div>

            <div className="mt-6">
              <UnderlineField label="confirm password" focused={focusedField === "confirm"} hasError={matchError}>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setMatchError(false); }}
                  onFocus={() => setFocusedField("confirm")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent border-0 outline-none font-sans text-[17px] text-ink pb-3 pt-[10px]"
                />
              </UnderlineField>
              {matchError && (
                <div className="flex items-center gap-[7px] mt-[10px]">
                  <SprigIcon />
                  <span className="font-display italic text-[14px] text-[#C2603C]">passwords don&apos;t match</span>
                </div>
              )}
            </div>

            <div className="mt-8">
              <Button type="submit" disabled={loading} className="w-full justify-center">
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </div>

            <div className="flex justify-center mt-6">
              <Link href="/auth/login" className="font-display italic text-[14px] text-moss hover:underline">
                already have an account? sign in
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
