"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-[500px] flex flex-col items-center">

        <div className="pt-8 pb-5">
          <svg width="200" height="220" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="100" cy="196" rx="60" ry="6" fill="#E8DFC8"/>
            <path d="M100 194 C99 170 98 150 100 110 C101 80 100 60 100 40" stroke="#4F6B4A" strokeWidth="2" strokeLinecap="round"/>
            <path d="M100 170 C100 170 72 162 64 140 C64 140 86 134 100 152" stroke="#4F6B4A" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
            <path d="M100 162 C90 156 76 150 66 142" stroke="#4F6B4A" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
            <path d="M100 155 C100 155 130 145 138 122 C138 122 114 118 100 138" stroke="#4F6B4A" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
            <path d="M100 147 C112 140 126 132 137 124" stroke="#4F6B4A" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
            <path d="M100 130 C100 130 68 118 62 94 C62 94 88 90 100 114" stroke="#4F6B4A" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
            <path d="M100 122 C88 114 74 106 64 96" stroke="#4F6B4A" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
            <path d="M100 116 C100 116 134 104 140 78 C140 78 114 76 100 100" stroke="#4F6B4A" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
            <path d="M100 108 C114 100 128 90 139 80" stroke="#4F6B4A" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
            <path d="M100 88 C100 88 74 74 72 52 C72 52 96 52 100 76" stroke="#4F6B4A" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
            <path d="M100 80 C90 72 80 62 73 54" stroke="#4F6B4A" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
            <path d="M100 72 C100 72 128 60 132 38 C132 38 108 38 100 62" stroke="#4F6B4A" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
            <path d="M100 64 C112 56 124 46 131 40" stroke="#4F6B4A" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
            <path d="M100 40 C98 30 96 20 100 12 C104 20 102 30 100 40Z" stroke="#4F6B4A" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
            <path d="M100 194 C92 194 86 200 78 202" stroke="#4F6B4A" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
            <path d="M100 194 C108 194 114 200 122 202" stroke="#4F6B4A" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
            <path d="M95 196 C90 198 84 204 80 208" stroke="#4F6B4A" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.6"/>
            <path d="M105 196 C110 198 116 204 120 208" stroke="#4F6B4A" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.6"/>
          </svg>
        </div>

        <h1 className="font-display font-medium text-[36px] text-ink text-center mb-[6px]">Plotted</h1>
        <p className="font-display italic text-[15px] font-normal text-ink-soft text-center mb-10">your garden, recorded</p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col">
          <UnderlineField label="email" focused={focusedField === "email"}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              className="w-full bg-transparent border-0 outline-none font-sans text-[17px] text-ink pb-3 pt-[10px]"
            />
          </UnderlineField>

          <div className="mt-6">
            <UnderlineField label="password" focused={focusedField === "password"} hasError={!!error}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                className="w-full bg-transparent border-0 outline-none font-sans text-[17px] text-ink pb-3 pt-[10px]"
              />
            </UnderlineField>
            {error && (
              <div className="flex items-center gap-[7px] mt-[10px]">
                <SprigIcon />
                <span className="font-display italic text-[14px] text-[#C2603C]">{error}</span>
              </div>
            )}
          </div>

          <div className="mt-8">
            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </div>

          <div className="flex justify-between mt-6">
            <Link href="/auth/forgot-password" className="font-display italic text-[14px] text-moss hover:underline">
              forgot password?
            </Link>
          </div>
        </form>

      </div>
    </div>
  );
}
