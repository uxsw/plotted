"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import Wordmark from "@/components/Wordmark";
import { Icon } from "@/components/ui/Icon";

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
    ? "bg-marigold scale-x-100"
    : "bg-marigold scale-x-0";

  return (
    <div>
      <label className={`brevier ${labelCls}`}>
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
    <div className="c-auth-page">
      <div className="o-stack--compact is-brand">
        <Wordmark />
        <p className="primer o-type--center">Start your garden record</p>
      </div>
      <div className="c-auth-page__form">
        <h1 className="pica o-type-display kirk o-row is-heading">
          <Icon name="leafygreen" aria-label="Create account" />
          Create a new account
        </h1>
        {success ? (
          <p className="o-type-disply primer">
            Thanks for signing up!<br />
            Check your email to confirm your account.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="o-stack--spacious u-w-100">
            {error && (
              <div className="o-surface--error o-row u-island">
                <Icon name="sprout" aria-label="error" />
                <span className="brevier">{error}</span>
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
                className="c-auth-page__input"
              />
            </UnderlineField>

            <UnderlineField label="password" focused={focusedField === "password"}>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                className="c-auth-page__input"
              />
            </UnderlineField>

            <div>
              <UnderlineField label="confirm password" focused={focusedField === "confirm"} hasError={matchError}>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setMatchError(false); }}
                  onFocus={() => setFocusedField("confirm")}
                  onBlur={() => setFocusedField(null)}
                  className="c-auth-page__input"
                />
              </UnderlineField>
              {matchError && (
                <div className="o-surface--error o-row u-island">
                  <Icon name="sprout" aria-label="error" />
                  <span className="brevier">passwords don&apos;t match</span>
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? "Creating account…" : "Create account"}
            </Button>

            <Link href="/auth/login" className="minion">
              Already have an account? Sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
