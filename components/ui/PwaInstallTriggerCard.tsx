"use client";

import { Button } from "@/components/ui/Button";
import { usePwaInstallPrompt } from "@/lib/hooks/usePwaInstallPrompt";
import { isIOS, isAndroid } from "@/lib/utils/platform";

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
  const { shouldShow, dismiss, variant: _variant } = usePwaInstallPrompt({
    initialDismissCount,
    initialInstalledAt,
    plantCount,
  });

  if (!shouldShow) return null;

  const ios = isIOS();
  const android = isAndroid();
  const ctaLabel = android ? "Install" : ios ? "Show me how" : "Install";

  function handleCta() {
    // Stage 3 wires the Android beforeinstallprompt flow here.
    // Stage 4 wires the iOS explainer overlay here.
    console.log("[pwa] install CTA tapped, platform:", android ? "android" : ios ? "ios" : "other");
  }

  return (
    <div className="flex gap-3 bg-moss-tint border border-moss/30 rounded-[12px] p-4">
      <div className="shrink-0 text-moss mt-0.5">
        <PhoneDownloadIcon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-sans font-medium text-ink leading-snug">
          Add Plotted to your home screen
        </p>
        <p className="text-[13px] font-sans text-ink-soft mt-0.5 leading-snug">
          Quick access to your garden, anytime.
        </p>
        <div className="flex items-center gap-4 mt-3">
          <Button variant="primary" onClick={handleCta} className="text-[13px] px-3 py-1.5">
            {ctaLabel}
          </Button>
          <button
            type="button"
            onClick={dismiss}
            className="text-[13px] font-sans text-ink-soft hover:text-ink transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
