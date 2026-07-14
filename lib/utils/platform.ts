// UA sniffing is used deliberately — no reliable feature-detection alternative
// exists for iOS/Android mobile detection. iPadOS 13+ disguises its UA as
// desktop Safari (Mac+no touch hint in UA), so detection requires the
// Mac+maxTouchPoints combination. Do not "simplify" this without verifying
// iPad detection still works.

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (/Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  );
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/.test(navigator.userAgent);
}

export function isMobileInstallable(): boolean {
  return isIOS() || isAndroid();
}
