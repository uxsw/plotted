"use client";

import { useState, useEffect } from "react";

function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function useIsStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(getIsStandalone);

  useEffect(() => {
    const mql = window.matchMedia("(display-mode: standalone)");
    function handleChange() {
      setIsStandalone(getIsStandalone());
    }
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return isStandalone;
}
