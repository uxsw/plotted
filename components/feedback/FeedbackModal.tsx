"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { submitFeedback } from "@/app/(app)/actions/submitFeedback";

type FeedbackType = "bug" | "ux" | "other";

interface Props {
  onClose: () => void;
}

const TYPES: { value: FeedbackType; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "other", label: "Feedback" },
];

export default function FeedbackModal({ onClose }: Props) {
  const [type, setType] = useState<FeedbackType>("bug");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [referenceCode, setReferenceCode] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please describe the issue.");
      return;
    }
    setLoading(true);
    setError(null);

    const result = await submitFeedback({
      type,
      description,
      page_url: window.location.href,
    });

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      setReferenceCode(result.reference_code);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end p-6 sm:items-center sm:justify-center"
      style={{ background: "rgba(43,42,36,0.35)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-[14px] bg-paper shadow-xl border border-sand-line p-6 flex flex-col gap-5"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.06'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "300px 300px",
          backgroundBlendMode: "multiply",
        }}
      >
        {referenceCode ? (
          <SuccessState referenceCode={referenceCode} onClose={onClose} />
        ) : (
          <FormState
            type={type}
            setType={setType}
            description={description}
            setDescription={setDescription}
            error={error}
            loading={loading}
            onSubmit={handleSubmit}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

function SuccessState({ referenceCode, onClose }: { referenceCode: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(referenceCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold text-ink">Thanks for the feedback</h2>
        <p className="text-sm font-sans text-ink-soft">Your report has been received.</p>
      </div>

      <div className="rounded-[10px] bg-moss-tint border border-moss/20 px-5 py-4 flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-sans font-semibold uppercase tracking-wider text-moss-deep" style={{ fontVariant: "small-caps" }}>
          Reference code
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl font-semibold text-moss-deep tracking-widest">
            {referenceCode}
          </span>
          {copied ? (
            <span className="text-xs font-sans text-moss font-medium">Copied!</span>
          ) : (
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy reference code"
              className="text-moss-deep/60 hover:text-moss-deep transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss rounded"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
                <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <p className="text-xs font-sans text-ink-soft leading-relaxed">
        Want to include a screenshot? Email it to{" "}
        <a
          href="mailto:john@johncowen.co.uk"
          className="text-moss underline underline-offset-2"
        >
          john@johncowen.co.uk
        </a>{" "}
        with your reference number.
      </p>

      <Button variant="secondary" onClick={onClose}>
        Done
      </Button>
    </>
  );
}

interface FormStateProps {
  type: FeedbackType;
  setType: (t: FeedbackType) => void;
  description: string;
  setDescription: (d: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

function FormState({
  type, setType, description, setDescription, error, loading, onSubmit, onClose,
}: FormStateProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold text-ink">Send feedback</h2>
        <p className="text-sm font-sans text-ink-soft">Tell us what's wrong or what could be better.</p>
      </div>

      {/* Segmented control */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold font-sans uppercase tracking-wider text-ink-soft" style={{ fontVariant: "small-caps" }}>
          Type
        </span>
        <div className="flex rounded-[10px] border border-sand-line bg-paper-deep overflow-hidden">
          {TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={[
                "flex-1 py-2 text-xs font-sans font-medium transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-moss",
                type === value
                  ? "bg-moss text-white"
                  : "text-ink-soft hover:text-ink hover:bg-sand/50",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="feedback-description"
          className="text-xs font-semibold font-sans uppercase tracking-wider text-ink-soft"
          style={{ fontVariant: "small-caps" }}
        >
          Description
        </label>
        <textarea
          id="feedback-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe what happened…"
          className={[
            "rounded border px-3 py-2 text-sm font-sans text-ink resize-none",
            "bg-paper placeholder:text-ink-soft/50",
            "transition-colors duration-150",
            error
              ? "border-clay focus:outline-none focus:ring-2 focus:ring-clay focus:ring-offset-1 focus:ring-offset-paper"
              : "border-sand-line focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-1 focus:ring-offset-paper focus:border-moss focus:bg-moss-tint/30",
          ].join(" ")}
        />
        {error && (
          <p role="alert" className="text-xs font-sans text-clay">{error}</p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Sending…" : "Send feedback"}
        </Button>
      </div>
    </form>
  );
}
