"use client";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";

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

// Stable empty-array reference used as the displayedResults value when query is
// short — avoids a new [] each render which would break the render-time
// adjustment comparison below.
const EMPTY: GeoResult[] = [];

export function LocationSearch({ onSelect, onCancel }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Computed during render — hides stale results while query is too short,
  // without needing a synchronous setState in the effect guard.
  const displayedResults = query.length >= 2 ? results : EMPTY;

  // Render-time adjustment: reset highlight whenever the visible result set
  // changes (new fetch landed, or results hidden because query shrank).
  // This replaces the useEffect-on-results pattern that the lint rule flags.
  const [prevDisplayedResults, setPrevDisplayedResults] = useState<GeoResult[]>(EMPTY);
  if (prevDisplayedResults !== displayedResults) {
    setPrevDisplayedResults(displayedResults);
    setHighlightedIndex(-1);
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // No setState here when query is short — displayedResults handles hiding.
    if (query.length < 2) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Try UK postcode first; falls back to Open-Meteo if no match.
        const postcodeRes = await fetch(
          `/api/postcode?q=${encodeURIComponent(query)}`
        );
        const { result: postcodeResult } = await postcodeRes.json();
        if (postcodeResult) {
          setResults([
            {
              id: 0,
              name: postcodeResult.label,
              latitude: postcodeResult.latitude,
              longitude: postcodeResult.longitude,
            },
          ]);
          return;
        }

        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
        );
        const json = await res.json();
        setResults(json.results ?? EMPTY);
      } catch {
        setResults(EMPTY);
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
    if (e.key === "Escape") {
      onCancel();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, displayedResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(displayedResults[highlightedIndex]);
    }
  }

  return (
    <div>
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          placeholder="Search for a location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className={[
            "o-text-input",
          ].join(" ")}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-soft bosco">
            …
          </span>
        )}
      </div>

      {displayedResults.length > 0 && (
        <ul
          role="listbox"
          className="c-location-search__menu"
        >
          {displayedResults.map((r, i) => (
            <li key={r.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlightedIndex}
                onClick={() => handleSelect(r)}
                className={[
                  "c-location-search__menu-item brevier",
                  i === highlightedIndex
                    ? "is-selected"
                    : "is-hover",
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
        className={clsx(
          buttonStyles["o-button"],
          buttonStyles["o-button--ghost"]
        )}
      >
        Cancel
      </button>
    </div>
  );
}
