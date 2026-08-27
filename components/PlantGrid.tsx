"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import clsx from "clsx";
import * as Popover from "@radix-ui/react-popover";
import { useRouter } from "next/navigation";
import type { Plant } from "@/lib/types";
import { scientificNameString, autocompleteTitle } from "@/lib/plantName";
import { PlantName } from "@/components/plants/PlantName";
import { Card } from "@/components/ui/Card";
import { SunBadge } from "@/components/ui/SunBadge";
import { PlaceholderPlantCard } from "@/components/ui/PlaceholderPlantCard";
import { FLOWERING_SEASON_BADGE_MODIFIER, getSeasonBand, formatSeason } from "@/components/ui/FloweringSeasonBadge";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";

const CURRENT_MONTH = new Date().getMonth() + 1; // 1–12

// ─── Filter options ───────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { id: "flowering-now", label: "Flowering now",          Icon: FlowerIcon },
  { id: "full sun",               label: "Full sun",               Icon: SunIcon },
  { id: "partial shade",          label: "Partial shade",          Icon: CloudIcon },
  { id: "full shade",             label: "Full shade",             Icon: MoonIcon },
  { id: "full sun / partial shade", label: "Full sun / partial shade", Icon: SunCloudIcon },
] as const;

type FilterId = typeof FILTER_OPTIONS[number]["id"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrapMonth(m: number): number {
  if (m < 1) return m + 12;
  if (m > 12) return m - 12;
  return m;
}

function isFloweringNow(plant: Plant): boolean {
  const { flowering_season_from: from, flowering_season_to: to } = plant;
  if (from === null || to === null) return false;
  const window = [wrapMonth(CURRENT_MONTH - 1), CURRENT_MONTH, wrapMonth(CURRENT_MONTH + 1)];
  return window.some(m =>
    from <= to ? m >= from && m <= to : m >= from || m <= to
  );
}

function matchesSearch(plant: Plant, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    (plant.species?.toLowerCase().includes(lower) ?? false) ||
    (plant.cultivar?.toLowerCase().includes(lower) ?? false) ||
    (plant.common_names?.some(n => n.toLowerCase().includes(lower)) ?? false)
  );
}

function applyFilter(plant: Plant, filter: FilterId | null): boolean {
  if (!filter) return true;
  if (filter === "flowering-now") return isFloweringNow(plant);
  return plant.sun_needs === filter;
}

type AutocompleteItem = {
  plant: Plant;
  primaryText: string;
  secondaryText: string | null;
  matchedOn: "species" | "cultivar" | "common";
};

function getAutocompleteItems(plants: Plant[], query: string): AutocompleteItem[] {
  if (!query) return [];
  const q = query.toLowerCase();
  const items: AutocompleteItem[] = [];
  for (const plant of plants) {
    if (items.length >= 5) break;
    const matchedCommon = plant.common_names?.find(n => n.toLowerCase().includes(q));
    const onSpecies = plant.species?.toLowerCase().includes(q) ?? false;
    const onCultivar = plant.cultivar?.toLowerCase().includes(q) ?? false;
    if (!onSpecies && !onCultivar && !matchedCommon) continue;
    items.push({
      plant,
      primaryText: autocompleteTitle(plant),
      secondaryText: matchedCommon ?? plant.common_names?.[0] ?? null,
      matchedOn: matchedCommon ? "common" : onSpecies ? "species" : "cultivar",
    });
  }
  return items;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function XSmallIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
    </svg>
  );
}

function FlowerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="1.4" />
      <circle cx="6.5" cy="2.5" r="1.3" />
      <circle cx="6.5" cy="10.5" r="1.3" />
      <circle cx="2.5" cy="6.5" r="1.3" />
      <circle cx="10.5" cy="6.5" r="1.3" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="2" />
      <line x1="6.5" y1="1" x2="6.5" y2="2.5" />
      <line x1="6.5" y1="10.5" x2="6.5" y2="12" />
      <line x1="1" y1="6.5" x2="2.5" y2="6.5" />
      <line x1="10.5" y1="6.5" x2="12" y2="6.5" />
      <line x1="2.9" y1="2.9" x2="4" y2="4" />
      <line x1="9" y1="9" x2="10.1" y2="10.1" />
      <line x1="10.1" y1="2.9" x2="9" y2="4" />
      <line x1="2.9" y1="10.1" x2="4" y2="9" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 9.5a2.5 2.5 0 0 1 0-5 3 3 0 0 1 6 .5A2 2 0 0 1 9 9.5H2.5z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.5 9A5.5 5.5 0 0 1 4 2.5a5 5 0 1 0 6.5 6.5z" />
    </svg>
  );
}

function SunCloudIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="4.5" cy="4.5" r="1.8" />
      <line x1="4.5" y1="1" x2="4.5" y2="2" />
      <line x1="1" y1="4.5" x2="2" y2="4.5" />
      <line x1="2" y1="2" x2="2.8" y2="2.8" />
      <line x1="7" y1="2" x2="6.2" y2="2.8" />
      <path d="M3.5 11a2.5 2.5 0 0 1 0-5 3 3 0 0 1 6 .5A2 2 0 0 1 9.5 11H3.5z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1,5.5 4,8.5 10,2" />
    </svg>
  );
}

// ─── Highlight helper ─────────────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-marigold font-semibold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlantGrid({ plants }: { plants: Plant[] }) {
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [activeFilter, setActiveFilter] = useState<FilterId | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const router = useRouter();

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const autocompleteItems = useMemo(() => getAutocompleteItems(plants, query), [plants, query]);
  const showAutocomplete = dropdownOpen && autocompleteItems.length > 0;

  const filtered = useMemo(() =>
    plants.filter(p => {
      if (query && !matchesSearch(p, query)) return false;
      if (!applyFilter(p, activeFilter)) return false;
      return true;
    }),
    [plants, query, activeFilter]
  );


  // Close autocomplete dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setHighlighted(-1);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function selectItem(item: AutocompleteItem) {
    setQuery(item.plant.species ?? item.plant.cultivar ?? "");
    setDropdownOpen(false);
    setHighlighted(-1);
    inputRef.current?.focus();
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && showAutocomplete) {
      e.preventDefault();
      const next = highlighted < autocompleteItems.length - 1 ? highlighted + 1 : 0;
      setHighlighted(next);
      itemRefs.current[next]?.focus();
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
      setHighlighted(-1);
    }
  }

  function handleItemKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = index < autocompleteItems.length - 1 ? index + 1 : 0;
      setHighlighted(next);
      itemRefs.current[next]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index === 0) {
        setHighlighted(-1);
        inputRef.current?.focus();
      } else {
        const prev = index - 1;
        setHighlighted(prev);
        itemRefs.current[prev]?.focus();
      }
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
      setHighlighted(-1);
      inputRef.current?.focus();
    }
  }

  function clearSearch() {
    setQuery("");
    setDropdownOpen(false);
    setHighlighted(-1);
    inputRef.current?.focus();
  }

  function toggleFilter(id: FilterId) {
    setActiveFilter(prev => (prev === id ? null : id));
    setFilterOpen(false);
  }

  if (plants.length === 0) {
    return (
      <div className="c-plant-grid">
        <button
          type="button"
          onClick={() => router.push("/plants/new")}
          className="c-first-plant-card"
        >
          <div className="c-first-plant-card__media">
            <PlusIcon />
          </div>
          <div className="flex flex-col gap-1.5 p-4 flex-1">
            <h3 className="font-display font-medium text-base text-ink leading-snug">
              Add your first plant
            </h3>
            <p className="font-sans text-xs text-ink-soft leading-snug">
              Start building your garden portfolio.
            </p>
          </div>
        </button>
        <PlaceholderPlantCard opacity={0.5} />
        <PlaceholderPlantCard opacity={0.35} />
        <PlaceholderPlantCard opacity={0.2} />
      </div>
    );
  }

  const resultLabel =
    filtered.length === 0 ? "" :
    filtered.length === 1 ? "1 plant" :
    `${filtered.length} plants`;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-2">

        {/* Search input */}
        <div ref={searchRef} className="relative flex-1">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-ink-soft pointer-events-none">
              <Icon name="search" aria-label="Search plants" /> 
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => {
                const val = e.target.value;
                setQuery(val);
                setHighlighted(-1);
                setDropdownOpen(val.length >= 1);
              }}
              onFocus={() => { if (query.length >= 1) setDropdownOpen(true); }}
              onKeyDown={handleInputKeyDown}
              placeholder="search plants…"
              className="o-text-input w-full pl-9 pr-8 py-2.5 placeholder:text-ink-soft/50 outline-none focus:border-marigold transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-3 text-ink-soft hover:text-ink transition-colors"
              >
                <XSmallIcon />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {showAutocomplete && (
            <div className="o-autocomplete">
              {autocompleteItems.map((item, i) => (
                <button
                  key={item.plant.id}
                  ref={el => { itemRefs.current[i] = el; }}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => selectItem(item)}
                  onKeyDown={e => handleItemKeyDown(e, i)}
                  className="o-autocomplete__item"
                >
                  <span className="brevier">
                    <Highlight
                      text={item.primaryText}
                      query={item.matchedOn !== "common" ? query : ""}
                    />
                  </span>
                  {item.secondaryText && (
                    <span className="minion">
                      <Highlight
                        text={item.secondaryText}
                        query={item.matchedOn === "common" ? query : ""}
                      />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter button */}
        <Popover.Root open={filterOpen} onOpenChange={setFilterOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              aria-label="Filter plants"
              className={clsx(
                buttonStyles["o-button"],
                buttonStyles["o-button--icon"],
                "relative shrink-0"
              )}
            >
              <Icon name="filter" aria-label="Filter plants" />
              {activeFilter && !filterOpen && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-marigold" />
              )}
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              align="end"
              sideOffset={8}
              className="o-popover"
            >
              {FILTER_OPTIONS.map(({ id, label, Icon: OptionIcon }) => {
                const isActive = activeFilter === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleFilter(id)}
                    className={[
                      "o-popover__item",
                      isActive ? "is-active" : "is-default",
                    ].join(" ")}
                  >
                    <span>
                      <OptionIcon />
                    </span>
                    <span className="brevier">
                      {label}
                    </span>
                  </button>
                );
              })}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      {/* Active filter pill */}
      {activeFilter && (
        <div className="o-chip-group">
          <span className="o-chip is-info">
            {FILTER_OPTIONS.find(o => o.id === activeFilter)?.label}
            <button
              type="button"
              onClick={() => setActiveFilter(null)}
              aria-label="Clear filter"
              className="o-chip__action"
            >
              <Icon name="close" aria-label="remove filter" size={18} />
            </button>
          </span>
        </div>
      )}

      {/* Result count */}
      <p className="font-sans text-xs text-ink-soft -mt-1">{resultLabel}</p>

      {/* Plant grid or no-results message */}
      {filtered.length === 0 ? (
        <p className="o-surface--info brevier u-island--compact">No plants match this search</p>
      ) : (
        <div className="c-plant-grid">
          {filtered.map((plant, index) => {
            const sciName = scientificNameString(plant);
            const hasSeason = plant.flowering_season_from !== null && plant.flowering_season_to !== null;
            return (
              <Card
                key={plant.id}
                photoUrl={plant.photo_url}
                photoAlt={sciName}
                priority={index === 0}
                identificationStatus={plant.identification_status}
                title={<PlantName genus={plant.genus} species={plant.species} cultivar={plant.cultivar} variant="card" />}
                subtitle={plant.common_names?.[0]}
                sunBadge={plant.sun_needs ? <SunBadge value={plant.sun_needs} /> : undefined}
                tags={
                  hasSeason ? (
                    <span className={`o-badge is-sm ${FLOWERING_SEASON_BADGE_MODIFIER[getSeasonBand(plant.flowering_season_from!, plant.flowering_season_to!)]}`}>
                      {formatSeason(plant.flowering_season_from!, plant.flowering_season_to!)}
                    </span>
                  ) : undefined
                }
                href={`/plants/${plant.id}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
