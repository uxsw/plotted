export const PWA_PROMPT_THRESHOLDS = [2, 7, 14, 27] as const;

interface ShouldShowArgs {
  isStandalone: boolean;
  isMobileInstallable: boolean;
  installedAt: string | null;
  dismissCount: number;
  plantCount: number;
}

export function shouldShowPwaPrompt({
  isStandalone,
  isMobileInstallable,
  installedAt,
  dismissCount,
  plantCount,
}: ShouldShowArgs): boolean {
  if (isStandalone) return false;
  if (!isMobileInstallable) return false;
  if (installedAt !== null) return false;
  if (dismissCount >= PWA_PROMPT_THRESHOLDS.length) return false;
  return plantCount >= PWA_PROMPT_THRESHOLDS[dismissCount];
}
