"use client";

import { useState } from "react";
import { T, WRAP } from "./tokens";
import FadeIn from "./FadeIn";
import Eyebrow from "./Eyebrow";

const inputStyle = {
  width: "100%",
  fontFamily: T.s,
  fontSize: 15,
  color: T.ink,
  background: T.raised,
  border: `1px solid rgba(60,70,45,0.22)`,
  borderRadius: 8,
  padding: "13px 14px",
  outline: "none",
  boxSizing: "border-box" as const,
};

const labelStyle = {
  display: "block" as const,
  fontFamily: T.m,
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color: T.faint,
  marginBottom: 8,
};

export default function RequestAccess() {
  const [email,     setEmail]     = useState("");
  const [garden,    setGarden]    = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
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
        setFormError(data.error ?? "Something went wrong — please try again.");
      }
    } catch {
      setFormError("Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      id="request"
      style={{ width: "100%", background: T.sage, borderTop: "1px solid rgba(60,70,45,0.12)" }}
    >
      <div className={WRAP}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}
          className="py-[104px] max-[860px]:grid-cols-1 max-[860px]:gap-[52px] max-[860px]:py-[68px]"
        >
          {/* Left — copy */}
          <FadeIn>
            <Eyebrow text="Private beta" />
            <h2
              style={{ fontFamily: T.d, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", color: T.ink, margin: "0 0 22px", lineHeight: 1.08 }}
              className="text-[52px] max-[860px]:text-[clamp(32px,7.6vw,48px)] max-[480px]:text-[clamp(29px,8.4vw,40px)]"
            >
              Request an invitation.
            </h2>
            <p style={{ fontFamily: T.s, fontSize: 18, lineHeight: 1.62, color: T.body, margin: 0 }}>
              We&apos;re welcoming new gardeners a few at a time. Leave your details and we&apos;ll be
              in touch when a place opens.
            </p>
          </FadeIn>

          {/* Right — form or confirmation */}
          <FadeIn delay={0.12}>
            {submitted ? (
              <div style={{ background: T.paper, border: `1px solid rgba(60,70,45,0.16)`, borderRadius: 10, padding: "52px 40px", textAlign: "center" }}>
                <div style={{ fontFamily: T.m, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.moss, marginBottom: 16 }}>
                  Request received
                </div>
                <h3 style={{ fontFamily: T.d, fontStyle: "italic", fontWeight: 400, fontSize: 28, color: T.ink, margin: "0 0 16px", lineHeight: 1.2 }}>
                  Thank you — we&apos;ll be in touch.
                </h3>
                <p style={{ fontFamily: T.s, fontSize: 16, lineHeight: 1.62, color: T.body, margin: 0 }}>
                  You&apos;re on the list. We&apos;ll send your invitation when a place opens — usually
                  within a few weeks.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{ background: T.paper, border: `1px solid rgba(60,70,45,0.16)`, borderRadius: 10, padding: "34px 34px 36px" }}
              >
                <div style={{ marginBottom: 20 }}>
                  <label htmlFor="req-email" style={labelStyle}>Email address</label>
                  <input
                    id="req-email"
                    type="email"
                    required
                    placeholder="you@example.co.uk"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label htmlFor="req-garden" style={labelStyle}>
                    Tell us about your garden
                    <span style={{ fontFamily: T.s, fontSize: 12, letterSpacing: 0, textTransform: "none", color: T.meta, marginLeft: 6 }}>— optional</span>
                  </label>
                  <textarea
                    id="req-garden"
                    rows={3}
                    placeholder="A small town garden, mostly shade, lots of ferns and hellebores…"
                    value={garden}
                    onChange={e => setGarden(e.target.value)}
                    style={{ ...inputStyle, resize: "none" as const }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: "100%", fontFamily: T.s, fontSize: 15, fontWeight: 500, color: T.paper, background: T.mossDp, border: "none", padding: "15px 0", borderRadius: 999, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Requesting…" : "Request access"}
                </button>

                {formError && (
                  <p style={{ fontFamily: T.s, fontSize: 13, color: T.terra, margin: "12px 0 0", textAlign: "center" }}>
                    {formError}
                  </p>
                )}

                <p style={{ fontFamily: T.s, fontSize: 12.5, lineHeight: 1.55, color: T.meta, margin: "16px 0 0", textAlign: "center" }}>
                  We&apos;ll only use your email to send your invitation. No newsletters, no sharing.
                </p>
              </form>
            )}
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
