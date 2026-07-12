"use client";

import { useState, useEffect, useRef } from "react";

type GeoResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  admin2?: string;
  country?: string;
};

type Props = {
  onSelect: (latitude: number, longitude: number, label: string) => void;
  onCancel: () => void;
};

function formatLabel(r: GeoResult): string {
  return [r.name, r.admin2 ?? r.admin1, r.country].filter(Boolean).join(", ");
}

export function LocationSearch({ onSelect, onCancel }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
        );
        const json = await res.json();
        setResults(json.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(r: GeoResult) {
    onSelect(r.latitude, r.longitude, formatLabel(r));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onCancel();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          placeholder="Search for a location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className={[
            "w-full rounded border border-sand-line px-3 py-2 text-sm font-sans text-ink",
            "bg-paper placeholder:text-ink-soft/50",
            "focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-1 focus:ring-offset-paper focus:border-moss focus:bg-moss-tint/30",
            "transition-colors duration-150",
          ].join(" ")}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-soft">
            …
          </span>
        )}
      </div>

      {results.length > 0 && (
        <ul
          role="listbox"
          className="rounded border border-sand-line bg-paper shadow-sm overflow-hidden"
        >
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => handleSelect(r)}
                className={[
                  "w-full text-left px-3 py-2 text-sm font-sans text-ink",
                  "hover:bg-moss-tint/40 transition-colors duration-100",
                  "focus:outline-none focus:bg-moss-tint/40",
                ].join(" ")}
              >
                {formatLabel(r)}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="self-start text-xs font-sans text-ink-soft underline underline-offset-2 hover:text-ink transition-colors duration-100"
      >
        Cancel
      </button>
    </div>
  );
}
