import { describe, it, expect } from "vitest";
import { shouldShowPwaPrompt, PWA_PROMPT_THRESHOLDS } from "./pwaPromptSchedule";

const BASE = {
  isStandalone: false,
  isMobileInstallable: true,
  installedAt: null,
  dismissCount: 0,
  plantCount: PWA_PROMPT_THRESHOLDS[0], // exactly meets the first threshold
};

describe("shouldShowPwaPrompt", () => {
  it("returns true when all conditions are met", () => {
    expect(shouldShowPwaPrompt(BASE)).toBe(true);
  });

  it("returns false when already running in standalone mode", () => {
    expect(shouldShowPwaPrompt({ ...BASE, isStandalone: true })).toBe(false);
  });

  it("returns false on non-mobile devices", () => {
    expect(shouldShowPwaPrompt({ ...BASE, isMobileInstallable: false })).toBe(false);
  });

  it("returns false when the user has already installed the PWA", () => {
    expect(shouldShowPwaPrompt({ ...BASE, installedAt: "2024-06-01T10:00:00Z" })).toBe(false);
  });

  it("returns false once all dismissal thresholds are exhausted", () => {
    expect(
      shouldShowPwaPrompt({ ...BASE, dismissCount: PWA_PROMPT_THRESHOLDS.length, plantCount: 999 })
    ).toBe(false);
  });

  it("returns false when plant count is below the current threshold", () => {
    expect(shouldShowPwaPrompt({ ...BASE, plantCount: PWA_PROMPT_THRESHOLDS[0] - 1 })).toBe(false);
  });

  it("uses the correct threshold for each dismiss count", () => {
    PWA_PROMPT_THRESHOLDS.forEach((threshold, i) => {
      expect(shouldShowPwaPrompt({ ...BASE, dismissCount: i, plantCount: threshold })).toBe(true);
      expect(shouldShowPwaPrompt({ ...BASE, dismissCount: i, plantCount: threshold - 1 })).toBe(false);
    });
  });
});
