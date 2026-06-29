"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Plant } from "@/lib/types";
import { scientificNameString, ScientificName, autocompleteTitle } from "@/lib/plantName";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

function formatSeason(from: number, to: number): string {
  return `${MONTH_ABBR[from - 1]}–${MONTH_ABBR[to - 1]}`;
}


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

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4" />
      <line x1="9.8" y1="9.8" x2="13" y2="13" />
    </svg>
  );
}

function XSmallIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="1.5" y1="4" x2="13.5" y2="4" />
      <line x1="3.5" y1="7.5" x2="11.5" y2="7.5" />
      <line x1="5.5" y1="11" x2="9.5" y2="11" />
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
      <span className="text-moss font-semibold">{text.slice(idx, idx + query.length)}</span>
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
  const filterRef = useRef<HTMLDivElement>(null);
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


  // Close dropdown / popover on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setHighlighted(-1);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
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
      <EmptyState
        illustration={<GardenIllustration />}
        heading="Nothing planted yet"
        body="Add your first plant to start building your garden portfolio."
        action={
          <Button variant="primary" onClick={() => router.push("/plants/new")}>
            Add a plant
          </Button>
        }
      />
    );
  }

  const resultLabel =
    filtered.length === 0 ? "no plants match" :
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
              <SearchIcon />
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
              className="w-full pl-9 pr-8 py-2.5 bg-paper border border-sand-line rounded font-display italic text-[15px] text-ink placeholder:text-ink-soft/50 outline-none focus:border-moss transition-colors"
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
            <div className="absolute top-full left-0 right-0 mt-1 bg-paper border border-sand-line rounded shadow-md z-20 overflow-hidden">
              {autocompleteItems.map((item, i) => (
                <button
                  key={item.plant.id}
                  ref={el => { itemRefs.current[i] = el; }}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => selectItem(item)}
                  onKeyDown={e => handleItemKeyDown(e, i)}
                  className={[
                    "w-full text-left px-3 py-2.5 flex flex-col gap-0.5 outline-none transition-colors",
                    highlighted === i ? "bg-moss-tint" : "hover:bg-sand",
                  ].join(" ")}
                >
                  <span className="font-display italic text-[14px] text-ink leading-tight">
                    <Highlight
                      text={item.primaryText}
                      query={item.matchedOn !== "common" ? query : ""}
                    />
                  </span>
                  {item.secondaryText && (
                    <span className="font-sans text-[12px] text-ink-soft leading-tight">
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
        <div ref={filterRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setFilterOpen(o => !o)}
            aria-label="Filter plants"
            className={[
              "relative flex items-center justify-center w-10 h-10 rounded border transition-colors",
              filterOpen
                ? "bg-moss border-moss text-paper"
                : "bg-paper border-sand-line text-ink-soft hover:border-moss hover:text-ink",
            ].join(" ")}
          >
            <FilterIcon />
            {activeFilter && !filterOpen && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-moss" />
            )}
          </button>

          {/* Filter popover */}
          {filterOpen && (
            <div className="absolute top-full right-0 mt-1 w-52 bg-paper border border-sand-line rounded shadow-md z-20 overflow-hidden py-1">
              {FILTER_OPTIONS.map(({ id, label, Icon }) => {
                const isActive = activeFilter === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleFilter(id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-sand transition-colors outline-none"
                  >
                    <span className={isActive ? "text-moss" : "text-ink-soft"}>
                      <Icon />
                    </span>
                    <span className={[
                      "flex-1 font-display italic text-[14px]",
                      isActive ? "text-moss" : "text-ink",
                    ].join(" ")}>
                      {label}
                    </span>
                    {isActive && <span className="text-moss"><CheckIcon /></span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Active filter pill */}
      {activeFilter && (
        <div className="flex">
          <span className="inline-flex items-center gap-1.5 bg-moss-tint border border-moss rounded-full px-3 py-1 font-display italic text-[13px] text-moss-deep">
            {FILTER_OPTIONS.find(o => o.id === activeFilter)?.label}
            <button
              type="button"
              onClick={() => setActiveFilter(null)}
              aria-label="Clear filter"
              className="text-moss hover:text-moss-deep transition-colors leading-none"
            >
              <XSmallIcon />
            </button>
          </span>
        </div>
      )}

      {/* Result count */}
      <p className="font-display italic text-[13px] text-ink-soft -mt-1">{resultLabel}</p>

      {/* Plant grid or no-results message */}
      {filtered.length === 0 ? (
        <p className="font-display italic text-[15px] text-ink-soft text-center py-16">no plants match</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {filtered.map((plant, index) => {
            const sciName = scientificNameString(plant);
            const hasSeason = plant.flowering_season_from !== null && plant.flowering_season_to !== null;
            return (
              <Card
                key={plant.id}
                photoUrl={plant.photo_url}
                photoAlt={sciName}
                priority={index === 0}
                title={<ScientificName species={plant.species} cultivar={plant.cultivar} />}
                subtitle={plant.common_names?.[0]}
                tags={
                  <>
                    {hasSeason && (
                      <Tag color="season">
                        {formatSeason(plant.flowering_season_from!, plant.flowering_season_to!)}
                      </Tag>
                    )}
                    {plant.sun_needs && <Tag color="sun">{plant.sun_needs}</Tag>}
                  </>
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

function GardenIllustration() {
  return (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path
        d="M48 80V44M48 44C48 44 38 36 30 24M48 44C48 44 58 36 66 24M48 44C48 44 42 52 38 62M48 44C48 44 54 52 58 62"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M28 80h40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
