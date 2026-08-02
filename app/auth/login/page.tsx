"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import Wordmark from "@/components/Wordmark";
import { Icon } from "@/components/ui/Icon";


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
      <label className={`minion ${labelCls}`}>
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
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="c-login-page">
      <div className="o-stack--compact is-brand">
        <Wordmark />
        <p className="primer o-type--center">your garden, recorded</p>
      </div>
      <div className="c-login-page__form o-stack">
        <h1 className="pica o-type-display kirk o-row is-heading">
          <Icon name="leafygreen" aria-label="login" />
          Log in
        </h1>
        <form onSubmit={handleSubmit} className="o-stack u-w-100">
          <UnderlineField label="email" focused={focusedField === "email"}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              className="c-login-page__input"
            />
          </UnderlineField>

          <div>
            <UnderlineField label="password" focused={focusedField === "password"} hasError={!!error}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                className="c-login-page__input"
              />
            </UnderlineField>
            {error && (
              <div className="o-row o-surface--error u-island">
                <Icon name="sprout" aria-label="error" />
                <span className="brevier">{error}</span>
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full justify-center">
            {loading ? "Signing in…" : "Sign in"}
          </Button>

          <div className="flex justify-between mt-6">
            <Link href="/auth/forgot-password" className="minion">
              Forgot password?
            </Link>
          </div>
        </form>

      </div>
    </div>
  );
}
