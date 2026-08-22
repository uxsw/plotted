"use client";

import { useState, useTransition } from "react";
import { LocationSearch } from "@/components/weather/LocationSearch";
import { saveGardenLocation } from "@/app/actions/garden";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";

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
          <p className="mt-2 text-sm font-sans text-marigold">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="c-account-location__edit">
      <span className="brevier">
        {label ?? <span>Not set</span>}
      </span>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className={clsx(
            buttonStyles["o-button"],
            buttonStyles["o-button--ghost"]
          )}
      >
        Edit
      </button>
    </div>
  );
}
