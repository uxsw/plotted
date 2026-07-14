"use client";

import { useState, useCallback } from "react";
import { useIsStandalone } from "./useIsStandalone";
import { isMobileInstallable } from "@/lib/utils/platform";
import { shouldShowPwaPrompt } from "@/lib/utils/pwaPromptSchedule";
import { incrementPwaPromptDismissCount } from "@/app/actions/pwa";

interface UsePwaInstallPromptArgs {
  initialDismissCount: number;
  initialInstalledAt: string | null;
  plantCount: number;
}

export function usePwaInstallPrompt({
  initialDismissCount,
  initialInstalledAt,
  plantCount,
}: UsePwaInstallPromptArgs) {
  const isStandalone = useIsStandalone();
  const [dismissCount, setDismissCount] = useState(initialDismissCount);
  const [installedAt] = useState(initialInstalledAt);

  const shouldShow = shouldShowPwaPrompt({
    isStandalone,
    isMobileInstallable: isMobileInstallable(),
    installedAt,
    dismissCount,
    plantCount,
  });

  const dismiss = useCallback(async () => {
    // Update local state immediately so the card disappears without waiting for the server round-trip.
    setDismissCount((c) => c + 1);
    await incrementPwaPromptDismissCount();
  }, []);

  return { shouldShow, dismiss, variant: "default" as const };
}
