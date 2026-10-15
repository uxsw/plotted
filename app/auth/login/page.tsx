"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Wordmark from "@/components/Wordmark";
import Horizon from "../../(marketing)/_components/Horizon";
import Wind from "../../(marketing)/_components/Wind";

/**
 * Sign in: the morning after the homepage's walk. The walk ends at the gate
 * at 10 pm on damson with blossom ink; this page turns that round, blossom
 * ground and damson ink, with the same planting on the ground line. The form
 * is a white T-label staked into the border. Styles: styles/pages/_auth.scss.
 */

// TODO: Natalie — placeholder copy for review
const QUERY_ERROR_MESSAGES: Record<string, string> = {
  confirmation_failed: "That confirmation link has expired or has already been used. Try signing up again.",
  auth_callback_failed: "Something went wrong. Please try again.",
};

/* What the garden is doing this month, in a UK garden. Index is the month. */
const SEASON = [
  "Deep winter. Snowdrops at the edges, hellebores opening, and the birds glad of whatever you leave out.",
  "Late winter. Crocus and the first daffodils, and last year’s grasses to cut back before they grow.",
  "Early spring. Daffodils, pulmonaria and the first blossom, and seed trays on every windowsill.",
  "Mid-spring. Tulips and fern fronds unfurling, and one eye on the late frosts.",
  "Late spring. Alliums and the first roses, and everything growing faster than you can tie it in.",
  "Early summer. Peonies and hardy geraniums, and long light evenings for the watering.",
  "High summer. Lavender and salvias, and the bees working through them.",
  "Late summer. Echinacea, verbena and the grasses catching the light. Keep deadheading.",
  "Early autumn. Asters, sedums and dahlias still going, and bulbs waiting to go in.",
  "Mid-autumn. Asters and the last of the dahlias, and leaves to rake into the borders.",
  "Late autumn. Seedheads left standing, tulips to plant, and the garden going quiet.",
  "Midwinter. Winter honeysuckle, berries for the birds, and next year to plan.",
];

/* The garden's clock is UK time, on the server and in the browser alike. */
function gardenNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "numeric",
    month: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const read = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const hour = read("hour");
  return {
    greeting: hour >= 4 && hour < 12 ? "Good morning." : hour >= 12 && hour < 18 ? "Good afternoon." : "Good evening.",
    season: SEASON[read("month") - 1] ?? SEASON[0],
  };
}

function signInError(message: string) {
  if (/confirm/i.test(message)) {
    return "Your email isn’t confirmed yet. Use the link in the email we sent when you signed up.";
  }
  return "That email and password don’t match. Check them and try again.";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryError = QUERY_ERROR_MESSAGES[searchParams.get("error") ?? ""] ?? null;
  const [{ greeting, season }] = useState(gardenNow);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "signing-in" | "opening">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("signing-in");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(signInError(error.message));
        setStatus("idle");
        return;
      }
    } catch {
      setError("We couldn’t reach Plotted. Check your connection and try again.");
      setStatus("idle");
      return;
    }
    // The border flowers while the dashboard loads; nothing waits on it.
    setStatus("opening");
    router.push("/dashboard");
    router.refresh();
  }

  const busy = status !== "idle";
  const alert = error ?? queryError;

  return (
    <div className="c-walk">
      <main className={`c-walk__band is-blossom c-walk-login${status === "opening" ? " is-opening" : ""}`}>
        <header className="c-walk__wrap c-walk-login__head">
          <Wordmark className="c-walk-login__wordmark" />
          <Link href="/#gate" className="c-walk__link">
            Request an invitation
          </Link>
        </header>

        <div className="c-walk__wrap c-walk-login__body">
          <div className="c-walk-login__copy">
            <h1 className="c-walk__display" suppressHydrationWarning>
              {greeting}
            </h1>
            <p className="c-walk__lead" suppressHydrationWarning>
              {season}
            </p>
          </div>

          <div className="c-walk-login__label">
            <form className="c-walk__sheet c-walk-login__sheet" onSubmit={handleSubmit}>
              <h2 className="c-walk-login__title">Sign in</h2>

              <label htmlFor="login-email" className="c-walk__mono">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                aria-invalid={error ? true : undefined}
                aria-describedby={alert ? "login-alert" : undefined}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
              />

              <label htmlFor="login-password" className="c-walk__mono">
                Password
              </label>
              <div className="c-walk-login__secret">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={alert ? "login-alert" : undefined}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                />
                <button
                  type="button"
                  className="c-walk-login__reveal"
                  aria-controls="login-password"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {alert && (
                <p id="login-alert" className="c-walk-login__alert" role="alert">
                  {alert}
                </p>
              )}

              <button type="submit" className="c-walk__button c-walk-login__submit" disabled={busy}>
                {status === "opening" ? "Opening your garden…" : status === "signing-in" ? "Signing in…" : "Sign in"}
              </button>

              <Link href="/auth/forgot-password" className="c-walk-login__forgot">
                Forgotten your password?
              </Link>
            </form>
            <span className="c-walk-login__stake" aria-hidden="true" />
          </div>
        </div>

        <Horizon
          seed={104}
          count={40}
          reach={0.62}
          blooms={["#fff", "#E26650", "#F6B73C", "#82175D", "#fff"]}
          visitors={[[9, "butterfly"], [31, "bird"]]}
          immediate
        />
      </main>
      <Wind />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
