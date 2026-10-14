"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * 10 pm · the gate. The last band: the request-access form (POST
 * /api/waitlist, unchanged), what Plotted will not do, and the footer.
 */

const PROMISES = [
  [
    "Made for gardeners, not trackers.",
    "No dashboards of statistics, no streaks, no scores. You come back because the week is worth reading.",
  ],
  [
    "Clever in two places only.",
    "The AI looks plants up and drafts planting schemes. Everywhere else it stays out of the way.",
  ],
  [
    "Your garden is yours.",
    "One private garden for each gardener. Nothing you record is shown to anyone else.",
  ],
] as const;

export default function Gate() {
  const [email, setEmail] = useState("");
  const [garden, setGarden] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, garden_notes: garden }),
      });
      const data = await res.json();
      if (data.ok) {
        setSubmitted(true);
      } else {
        setFormError(data.error ?? "That didn’t go through. Please try again.");
      }
    } catch {
      setFormError("That didn’t go through. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="gate" className="c-walk__band is-damson c-walk-gate">
      <div className="c-walk__wrap c-walk-gate__body">
        <div className="c-walk-gate__copy">
          <h2 className="c-walk__heading">Request an invitation.</h2>
          <p className="c-walk__lead">
            Plotted is in private beta and free while it is. We are welcoming new gardeners
            a few at a time. Leave your email and we will write when a place opens.
          </p>
        </div>

        {submitted ? (
          <div className="c-walk__sheet c-walk-gate__form" role="status">
            <h3 className="c-walk-gate__thanks">Thank you. You are on the list.</h3>
            <p>We will send your invitation when a place opens.</p>
          </div>
        ) : (
          <form className="c-walk__sheet c-walk-gate__form" onSubmit={handleSubmit}>
            <label htmlFor="gate-email" className="c-walk__mono">
              Email address
            </label>
            <input
              id="gate-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.co.uk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="gate-garden" className="c-walk__mono">
              Your garden <span>(optional)</span>
            </label>
            <textarea
              id="gate-garden"
              rows={3}
              placeholder="A small town garden, mostly shade, ferns and hellebores…"
              value={garden}
              onChange={(e) => setGarden(e.target.value)}
            />

            <button type="submit" className="c-walk__button" disabled={loading}>
              {loading ? "Sending…" : "Request access"}
            </button>

            {formError && (
              <p className="c-walk-gate__error" role="alert">
                {formError}
              </p>
            )}
            <p className="c-walk-gate__small">
              We use your email to send the invitation and for nothing else.
            </p>
          </form>
        )}

        <ul className="c-walk-gate__promises">
          {PROMISES.map(([title, body]) => (
            <li key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ul>
      </div>

      <footer className="c-walk__wrap c-walk-gate__foot">
        <p>Plotted. Built by gardeners, for gardeners.</p>
        <nav aria-label="Footer">
          <Link href="/auth/login" className="c-walk__link">
            Log in
          </Link>
          <Link href="/privacy" className="c-walk__link">
            Privacy policy
          </Link>
          <span>© {new Date().getFullYear()} Plotted</span>
        </nav>
      </footer>
    </section>
  );
}
