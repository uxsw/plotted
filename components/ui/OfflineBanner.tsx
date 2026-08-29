"use client";

import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-yellow border-b border-yellow/40 px-4 py-2.5 text-center brevier text-ink">
      You&apos;re offline — connect to wifi to view your garden
    </div>
  );
}
