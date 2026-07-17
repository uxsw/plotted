"use client";

import { useState, useTransition } from "react";
import { LocationSearch } from "@/components/weather/LocationSearch";
import { saveGardenLocation } from "@/app/actions/garden";

type Props = {
  initialLabel: string | null;
};

export function LocationEditor({ initialLabel }: Props) {
  const [label, setLabel] = useState(initialLabel);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSelect(latitude: number, longitude: number, newLabel: string) {
    setError(null);
    startTransition(async () => {
      const result = await saveGardenLocation(latitude, longitude, newLabel);
      if (result.error) {
        setError(result.error);
        return;
      }
      setLabel(newLabel);
      setIsEditing(false);
    });
  }

  if (isEditing) {
    return (
      <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
        <LocationSearch
          onSelect={handleSelect}
          onCancel={() => setIsEditing(false)}
        />
        {error && (
          <p className="mt-2 text-sm font-sans text-clay">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-sans text-ink">
        {label ?? <span className="text-ink-soft">Not set</span>}
      </span>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="shrink-0 text-sm font-sans text-moss underline underline-offset-2 hover:text-moss-deep transition-colors duration-100"
      >
        Edit
      </button>
    </div>
  );
}
