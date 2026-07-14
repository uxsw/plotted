"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { setPwaInstalledAt } from "@/app/actions/pwa";
import { Button } from "@/components/ui/Button";

// ─── Step illustrations ───────────────────────────────────────────────────────

// Step 1: value-prop — phone with home screen app icon
function PhoneWithAppIcon() {
  return (
    <svg width="72" height="88" viewBox="0 0 72 88" fill="none" aria-hidden="true"
      stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="4" width="52" height="80" rx="9" strokeWidth="2.5" />
      <line x1="30" y1="10" x2="42" y2="10" strokeWidth="2.5" />
      <rect x="22" y="24" width="28" height="28" rx="7" strokeWidth="2" />
      {/* Leaf inside the app icon */}
      <path d="M36 43c0-7 5-11 5-11s-5 1-5 11z" fill="currentColor" strokeWidth="0" fillOpacity="0.7" />
      <path d="M36 43c0-7-5-11-5-11s5 1 5 11z" fill="currentColor" strokeWidth="0" fillOpacity="0.5" />
      <line x1="36" y1="36" x2="36" y2="46" strokeWidth="1.5" />
      <line x1="30" y1="76" x2="42" y2="76" strokeWidth="2.5" />
    </svg>
  );
}

// Step 2: Safari share icon — the canonical iOS share sheet icon (SF Symbol: square.and.arrow.up).
// Drawn to be immediately recognisable: upward arrow rising from a rectangular tray.
function SafariShareIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true"
      stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* Tray / box */}
      <path d="M22 34v18a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4V34" strokeWidth="2.5" />
      {/* Arrow shaft */}
      <line x1="36" y1="14" x2="36" y2="42" strokeWidth="2.5" />
      {/* Arrow head */}
      <path d="M26 24l10-10 10 10" strokeWidth="2.5" />
    </svg>
  );
}

// Step 3: "Add to Home Screen" icon — a rounded-square home screen slot with a "+" badge.
// The iOS share sheet item uses a square with a "+" to represent adding to the home screen.
function AddToHomeScreenIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true"
      stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* Home screen tile outline */}
      <rect x="8" y="8" width="40" height="40" rx="10" strokeWidth="2.5" />
      {/* "+" badge circle */}
      <circle cx="54" cy="54" r="14" fill="currentColor" stroke="none" />
      {/* "+" symbol inside badge */}
      <line x1="54" y1="47" x2="54" y2="61" stroke="white" strokeWidth="2.5" />
      <line x1="47" y1="54" x2="61" y2="54" stroke="white" strokeWidth="2.5" />
    </svg>
  );
}

// ─── Step config ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    Illustration: PhoneWithAppIcon,
    headline: "Your garden, always at hand",
    body: "Plotted works as a home screen app — opens instantly, full screen, with no browser chrome in the way.",
    cta: "Show me how",
  },
  {
    Illustration: SafariShareIcon,
    headline: "Tap the Share icon",
    body: "Find it in Safari's toolbar — the box with an upward arrow — at the bottom of your screen.",
    cta: "Next",
  },
  {
    Illustration: AddToHomeScreenIcon,
    headline: "Tap 'Add to Home Screen'",
    body: "Scroll down in the share sheet until you see it, then tap it to add Plotted to your home screen.",
    cta: "Done",
  },
] as const;

// ─── Overlay ─────────────────────────────────────────────────────────────────

interface PwaIosInstallOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

export function PwaIosInstallOverlay({ isOpen, onClose }: PwaIosInstallOverlayProps) {
  const [step, setStep] = useState(0);
  // Separate animation flag so the slide-up triggers after the portal mounts.
  const [visible, setVisible] = useState(false);
  // Track previous isOpen to reset step during render when it transitions to true,
  // per React's "derived state from props" pattern (avoids setState-in-effect).
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setStep(0);
      // Reset to hidden so the slide-up transition plays on every open.
      setVisible(false);
    }
  }

  // Trigger the slide-up animation after the portal mounts (deferred callback, not direct setState).
  // setVisible(false) is handled above in the render body so this effect only ever sets true.
  useEffect(() => {
    if (!isOpen) return;
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  // Lock body scroll while overlay is open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  const { Illustration, headline, body, cta } = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  async function handleCta() {
    if (!isLastStep) {
      setStep((s) => s + 1);
      return;
    }
    // "Done" on the final step — reaching here is the best available signal that
    // the user completed the iOS Add to Home Screen walkthrough.
    await setPwaInstalledAt();
    onClose();
  }

  function handleClose() {
    // Closing early via the X button has no side-effects on the dismiss schedule
    // or the installed flag — the user just didn't finish the walkthrough.
    console.log("[pwa] ios overlay closed early at step", step + 1);
    onClose();
  }

  return createPortal(
    <div
      className={[
        "fixed inset-0 z-50 bg-paper flex flex-col",
        "transition-transform duration-300 ease-out",
        visible ? "translate-y-0" : "translate-y-full",
      ].join(" ")}
      role="dialog"
      aria-modal="true"
      aria-label="Add Plotted to your home screen"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
        <span className="text-[13px] font-sans text-ink-soft">
          Step {step + 1} of {STEPS.length}
        </span>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="p-1.5 -mr-1.5 text-ink-soft hover:text-ink transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
        >
          <XIcon />
        </button>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8 min-h-0">
        {/* Illustration */}
        <div className="flex items-center justify-center w-full">
          <div className="flex items-center justify-center w-36 h-36 rounded-[24px] bg-moss-tint text-moss">
            <Illustration />
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-3 text-center max-w-xs">
          <h2 className="font-display font-medium text-[26px] text-ink leading-tight">
            {headline}
          </h2>
          <p className="font-sans text-[15px] text-ink-soft leading-relaxed">
            {body}
          </p>
        </div>
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-2 py-4 shrink-0">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={[
              "rounded-full transition-all duration-200",
              i === step
                ? "w-5 h-2 bg-moss"
                : "w-2 h-2 bg-sand-line",
            ].join(" ")}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 shrink-0">
        <Button
          variant="primary"
          onClick={handleCta}
          className="w-full justify-center py-3 text-[15px]"
        >
          {cta}
        </Button>
      </div>
    </div>,
    document.body
  );
}
