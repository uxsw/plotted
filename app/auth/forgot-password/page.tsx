"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";
import Wordmark from "@/components/Wordmark";
import { Icon } from "@/components/ui/Icon";

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
    <div className="c-auth-page">
      <div className="o-stack--compact is-brand">
        <Wordmark />
        <p className="primer">Find your way back</p>
      </div>
      <div className="c-auth-page__form o-stack">
        <h1 className="pica o-type-display kirk o-row is-heading">
          <Icon name="leafygreen" aria-label="login" />
          Reset your password
        </h1>
       
        {!sent ? (
          
          <form onSubmit={handleRequestCode} className="o-stack u-w-100">
             <p className="brevier">Enter your email address and we'll send you a code to reset your password.</p>
            {error && (
              <div className="o-row o-surface--error u-island">
                <Icon name="sprout" aria-label="error" />
                <p className="brevier">{error}</p>
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

            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? "Sending…" : "Send reset code"}
            </Button>

            <Link
              href="/auth/login"
              className={clsx(
                buttonStyles["o-button"],
                buttonStyles["o-button--ghost"]
              )}>
              Back to sign in
            </Link>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="o-stack u-w-100">
            <p className="primer">
              Enter the code we sent to <b>{email}</b> along with your new password.
            </p>

            {error && (
              <div className="o-surface--error u-island">
                <p className="primer">{error}</p>
              </div>
            )}

            <UnderlineField label="Code" focused={focusedField === "code"}>
              <input
                type="text"
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onFocus={() => setFocusedField("code")}
                onBlur={() => setFocusedField(null)}
                className="c-auth-page__input"
              />
            </UnderlineField>

            <UnderlineField label="New password" focused={focusedField === "newPassword"}>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setFocusedField("newPassword")}
                onBlur={() => setFocusedField(null)}
                className="c-auth-page__input"
              />
            </UnderlineField>

            <UnderlineField label="Confirm password" focused={focusedField === "confirmPassword"}>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => setFocusedField(null)}
                className="c-auth-page__input"
              />
            </UnderlineField>

            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? "Updating…" : "Update password"}
            </Button>

            <Link
              href="/auth/login"
              className={clsx(
                buttonStyles["o-button"],
                buttonStyles["o-button--ghost"]
              )}>
              Back to sign in
            </Link>
          </form>
        )}

      </div>
    </div>
  );
}
