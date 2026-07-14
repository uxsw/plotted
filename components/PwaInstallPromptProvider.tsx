"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { setPwaInstalledAt } from "@/app/actions/pwa";

// BeforeInstallPromptEvent is not in the standard TS DOM lib.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaInstallEventContextValue {
  canInstall: boolean;
  install: () => Promise<"accepted" | "dismissed" | null>;
}

const PwaInstallEventContext = createContext<PwaInstallEventContextValue>({
  canInstall: false,
  install: async () => null,
});

export function PwaInstallPromptProvider({ children }: { children: React.ReactNode }) {
  // useRef to hold the event without triggering re-renders on capture.
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  // Separate boolean state so consumers re-render when the event becomes available.
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    }

    async function handleAppInstalled() {
      deferredPrompt.current = null;
      setCanInstall(false);
      await setPwaInstalledAt();
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function install(): Promise<"accepted" | "dismissed" | null> {
    if (!deferredPrompt.current) return null;
    const choice = await deferredPrompt.current.prompt();
    // The event can only be used once — clear it regardless of outcome.
    deferredPrompt.current = null;
    setCanInstall(false);
    return choice.outcome;
  }

  return (
    <PwaInstallEventContext.Provider value={{ canInstall, install }}>
      {children}
    </PwaInstallEventContext.Provider>
  );
}

export function usePwaInstallEvent(): PwaInstallEventContextValue {
  return useContext(PwaInstallEventContext);
}
