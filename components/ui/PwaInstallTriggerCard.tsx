"use client";

import { useState } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { usePwaInstallPrompt } from "@/lib/hooks/usePwaInstallPrompt";
import { usePwaInstallEvent } from "@/components/PwaInstallPromptProvider";
import { PwaIosInstallOverlay } from "@/components/ui/PwaIosInstallOverlay";
import { isAndroid } from "@/lib/utils/platform";
import buttonStyles from "@/components/ui/Button.module.css";

interface PwaInstallTriggerCardProps {
  initialDismissCount: number;
  initialInstalledAt: string | null;
  plantCount: number;
}

function PhoneDownloadIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="6" y="1" width="16" height="26" rx="3" />
      <line x1="10" y1="23" x2="18" y2="23" />
      <path d="M14 7v10m-4-4 4 4 4-4" />
    </svg>
  );
}

export function PwaInstallTriggerCard({
  initialDismissCount,
  initialInstalledAt,
  plantCount,
}: PwaInstallTriggerCardProps) {
  const { shouldShow, dismiss } = usePwaInstallPrompt({
    initialDismissCount,
    initialInstalledAt,
    plantCount,
  });
  const { canInstall, install } = usePwaInstallEvent();
  const [overlayOpen, setOverlayOpen] = useState(false);

  const android = isAndroid();

  // On Android, hide the card if Chrome never fired beforeinstallprompt —
  // showing a button that does nothing is worse than showing nothing.
  if (!shouldShow || (android && !canInstall)) return null;

  const ctaLabel = android ? "Install" : "Show me how";

  async function handleCta() {
    if (android) {
      const outcome = await install();
      // 'accepted' → appinstalled event fires separately and sets pwa_installed_at.
      // 'dismissed' → treat the same as "Not now" so the backoff schedule applies.
      if (outcome === "dismissed") dismiss();
    } else {
      setOverlayOpen(true);
    }
  }

  return (
    <>
      <div className="flex gap-3 surface-info p-4">
        <div className="shrink-0 mt-0.5">
          <PhoneDownloadIcon />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-sans font-medium leading-snug">
            Add Plotted to your home screen
          </p>
          <p className="text-[13px] font-sans mt-0.5 leading-snug">
            Quick access to your garden, anytime.
          </p>
          <div className="flex items-center gap-4 mt-3">
            <Button
              onClick={handleCta}
              className={clsx(
                buttonStyles["o-button"],
                buttonStyles["o-button--outline"]
              )}
            >
              {ctaLabel}
            </Button>
            <button
              type="button"
              onClick={dismiss}
              className="text-[13px] font-sans hover:text-ink transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
      <PwaIosInstallOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
      />
    </>
  );
}
