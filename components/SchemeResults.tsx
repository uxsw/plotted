"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MONTH_ABBR } from "@/components/ui/FloweringSeasonBadge";
import type { Scheme, SchemeSuggestion, SchemeTier } from "@/lib/types";

const TIER_ORDER: SchemeTier[] = ["back", "mid", "ground"];
const TIER_LABELS: Record<SchemeTier, string> = {
  back: "Back of border",
  mid: "Mid border",
  ground: "Ground cover",
};

const BADGE_CONFIG: {
  key: keyof Pick<SchemeSuggestion, "wildlife_value" | "drought_tolerant" | "edible" | "british_native">;
  label: string;
  className: string;
}[] = [
  { key: "wildlife_value", label: "Wildlife friendly", className: "bg-moss-tint text-moss-deep" },
  { key: "drought_tolerant", label: "Drought tolerant", className: "bg-gold-tint text-gold" },
  { key: "edible", label: "Edible", className: "bg-clay-tint text-clay" },
  { key: "british_native", label: "British native", className: "bg-sand text-ink-soft" },
];

function formatMonths(months: number[] | null): string | null {
  if (!months || months.length === 0) return null;
  return months.map((m) => MONTH_ABBR[m - 1]).join(", ");
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="1.5" y1="1.5" x2="10.5" y2="10.5" />
      <line x1="10.5" y1="1.5" x2="1.5" y2="10.5" />
    </svg>
  );
}

function SproutIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M24 8c-4 0-8 4-8 8s4 8 8 8c0 4-2 8-8 12h16c-6-4-8-8-8-12 4 0 8-4 8-8s-4-8-8-8z" />
    </svg>
  );
}

function Attribution({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[10px] font-sans text-ink-soft/70 hover:text-ink-soft underline"
    >
      Image: Wikimedia Commons
    </a>
  );
}

function EditableName({ schemeId, initialName }: { schemeId: string; initialName: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialName);
  const [saved, setSaved] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  async function commit() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === saved) {
      setValue(saved);
      setEditing(false);
      return;
    }
    setEditing(false);
    setValue(trimmed);
    setSaved(trimmed);
    try {
      const res = await fetch(`/api/schemes/${schemeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setValue(saved);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { setValue(saved); setEditing(false); }
        }}
        className="w-full font-display italic font-semibold text-[30px] leading-tight text-white bg-transparent border-b border-white/70 outline-none px-2 py-1.5 -ml-2"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-left w-full font-display italic font-semibold text-[30px] leading-tight text-white cursor-pointer rounded-[8px] transition-colors duration-[120ms] ease-in-out hover:bg-white/10 px-2 py-1.5 -ml-2 -mt-1.5"
    >
      {value}
    </button>
  );
}

function SuggestionCard({ suggestion, onDismiss }: { suggestion: SchemeSuggestion; onDismiss: (id: string) => void }) {
  const badges = BADGE_CONFIG.filter((b) => suggestion[b.key]);
  const monthsLabel = formatMonths(suggestion.flowering_months);

  return (
    <motion.div
      layout
      initial={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col rounded-lg overflow-hidden border border-sand-line bg-paper"
    >
      <div className="relative aspect-square w-full bg-paper-deep">
        {suggestion.wikimedia_image_url ? (
          <Image
            src={suggestion.wikimedia_image_url}
            alt={suggestion.common_name}
            fill
            sizes="(max-width: 500px) 50vw, 200px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sand-line">
            <SproutIcon />
          </div>
        )}
        <button
          type="button"
          onClick={() => onDismiss(suggestion.id)}
          aria-label={`Dismiss ${suggestion.common_name}`}
          className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <XIcon />
        </button>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h3 className="font-display font-medium text-sm text-ink leading-snug">{suggestion.common_name}</h3>
        <p className="font-display italic text-xs text-ink-soft leading-snug">{suggestion.latin_name}</p>
        <p className="font-sans text-xs text-ink leading-relaxed mt-1">{suggestion.why}</p>
        {(suggestion.height_cm || monthsLabel) && (
          <p className="font-sans text-[11px] text-ink-soft mt-0.5">
            {[suggestion.height_cm ? `${suggestion.height_cm}cm` : null, monthsLabel].filter(Boolean).join(" · ")}
          </p>
        )}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {badges.map((b) => (
              <span
                key={b.key}
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium font-sans leading-none ${b.className}`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
        <div className="mt-1">
          <Attribution url={suggestion.wikimedia_attribution} />
        </div>
      </div>
    </motion.div>
  );
}

export default function SchemeResults({
  scheme,
  suggestions: initialSuggestions,
  heroImage,
}: {
  scheme: Scheme;
  suggestions: SchemeSuggestion[];
  heroImage: string | null;
}) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [dismissError, setDismissError] = useState<string | null>(null);

  async function handleDismiss(id: string) {
    const previous = suggestions;
    setDismissError(null);
    setSuggestions((cur) => cur.filter((s) => s.id !== id));
    try {
      const res = await fetch(`/api/schemes/${scheme.id}/suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: false }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSuggestions(previous);
      setDismissError("Couldn't dismiss that suggestion — please try again.");
    }
  }

  const featuredSuggestion = scheme.featured_plant_latin
    ? suggestions.find((s) => s.latin_name === scheme.featured_plant_latin)
    : undefined;

  const narrativeBodyParagraphs = scheme.narrative_body.split(/\n{2,}/).filter(Boolean);

  const tiers = TIER_ORDER
    .map((tier) => ({ tier, items: suggestions.filter((s) => s.tier === tier) }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <div
        className="relative -mt-8"
        style={{
          width: "100vw",
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
          height: "55vh",
        }}
      >
        {heroImage ? (
          <Image
            src={heroImage}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-moss" />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 60%)" }}
        />

        <Link
          href="/schemes"
          className="absolute top-4 left-4 z-10 font-sans text-sm text-white/90 hover:text-white transition-colors"
        >
          ← Planting schemes
        </Link>

        <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-1">
          <EditableName schemeId={scheme.id} initialName={scheme.name} />
          {scheme.summary && (
            <p className="font-sans text-[15px] text-white/80 leading-snug">{scheme.summary}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 mt-6">
      <div className="flex flex-col gap-4 max-w-[680px] mx-auto">
        <p className="font-display text-[17px] text-ink leading-relaxed">{scheme.narrative_intro}</p>
        {narrativeBodyParagraphs.map((para, i) => (
          <p key={i} className="font-sans text-[17px] leading-[1.75] text-ink">{para}</p>
        ))}
      </div>

      {featuredSuggestion?.wikimedia_image_url && (
        <figure className="flex flex-col gap-1">
          <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-paper-deep">
            <Image src={featuredSuggestion.wikimedia_image_url} alt={featuredSuggestion.common_name} fill sizes="500px" className="object-cover" />
          </div>
          <Attribution url={featuredSuggestion.wikimedia_attribution} />
        </figure>
      )}

      {dismissError && <p className="text-sm text-clay">{dismissError}</p>}

      <div className="flex flex-col gap-6">
        {tiers.map(({ tier, items }) => (
          <div key={tier} className="flex flex-col gap-3">
            <h2 className="font-display font-medium text-lg text-ink">{TIER_LABELS[tier]}</h2>
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence initial={false}>
                {items.map((s) => (
                  <SuggestionCard key={s.id} suggestion={s} onDismiss={handleDismiss} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
      </div>
    </>
  );
}
