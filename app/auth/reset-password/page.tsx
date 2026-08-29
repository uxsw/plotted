"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [sessionReady, setSessionReady] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!code) {
      return;
    }
    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setError("This password reset link is invalid or has expired.");
      } else {
        setSessionReady(true);
      }
    });
  }, [code]);

  const displayError = error ?? (!code ? "This password reset link is invalid or has expired." : null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="long-pica kirk text-gray-900 mb-6 text-center">Garden Portfolio</h1>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="long-primer kirk text-gray-800">Set new password</h2>
          {displayError && <p className="brevier text-red-600 bg-red-50 p-2 rounded">{displayError}</p>}
          {sessionReady && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block o-type-label text-gray-700 mb-1">New password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 brevier focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 text-white py-2 rounded brevier o-type-weight--medium hover:bg-green-800 disabled:opacity-50"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
