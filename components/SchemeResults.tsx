"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MONTH_ABBR } from "@/components/ui/FloweringSeasonBadge";
import { AiNoticePanel } from "@/components/ui/AiNoticePanel";
import { FeatureNoticePanel } from "@/components/ui/FeatureNoticePanel";
import { markSchemeAiNoticeSeen } from "@/app/actions/schemes";
import { markShoppingListNoticeSeen } from "@/app/actions/shopping-list";
import type { Scheme, SchemeSuggestion, SchemeTier } from "@/lib/types";
import buttonStyles from "@/components/ui/Button.module.css";

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
  { key: "wildlife_value", label: "Wildlife friendly", className: "bg-marigold text-marigold" },
  { key: "drought_tolerant", label: "Drought tolerant", className: "bg-yellow text-yellow" },
  { key: "edible", label: "Edible", className: "bg-marigold text-marigold" },
  { key: "british_native", label: "British native", className: "bg-sand text-ink-soft" },
];

function formatMonths(months: number[] | null): string | null {
  if (!months || months.length === 0) return null;
  return months.map((m) => MONTH_ABBR[m - 1]).join(", ");
}

function CartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 1.5h1.8l1.4 6.5h6.1l1.4-4.8H4.2" />
      <circle cx="5.8" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9.8" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 6.5l2.5 2.5 5.5-5.5" />
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
        className="w-full font-display italic font-semibold text-[48px] leading-[1.2] text-white bg-transparent border-b border-white/70 outline-none px-2 py-1.5 -ml-2"
      />
    );
  }

  return (
    <h2
      onClick={() => setEditing(true)}
      className="canon o-type-display text-white"
    >
      {value}
    </h2>
  );
}

function SuggestionCard({
  suggestion,
  added,
  onAdd,
}: {
  suggestion: SchemeSuggestion;
  added: boolean;
  onAdd: (suggestion: SchemeSuggestion) => void;
}) {
  const badges = BADGE_CONFIG.filter((b) => suggestion[b.key]);
  const monthsLabel = formatMonths(suggestion.flowering_months);

  return (
    <motion.div
      layout
      initial={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col overflow-hidden border border-sand-line bg-paper"
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
          onClick={() => !added && onAdd(suggestion)}
          aria-label={added ? `${suggestion.common_name} added to shopping list` : `Add ${suggestion.common_name} to shopping list`}
          className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          {added ? <CheckIcon /> : <CartIcon />}
        </button>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h3 className="o-type-display long-primer kirk">{suggestion.common_name}</h3>
        <p className="font-display italic text-xs text-ink-soft leading-snug">{suggestion.latin_name}</p>
        <p className="brevier">{suggestion.why}</p>
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
  shoppingListNoticeSeen,
}: {
  scheme: Scheme;
  suggestions: SchemeSuggestion[];
  heroImage: string | null;
  shoppingListNoticeSeen: boolean;
}) {
  const [suggestions] = useState(initialSuggestions);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addError, setAddError] = useState<string | null>(null);
  const aiNoticeSeen = scheme.ai_notice_seen_at !== null;

  useEffect(() => {
    if (!aiNoticeSeen) {
      markSchemeAiNoticeSeen(scheme.id);
    }
  }, [scheme.id, aiNoticeSeen]);

  useEffect(() => {
    if (!shoppingListNoticeSeen) {
      markShoppingListNoticeSeen();
    }
  }, [shoppingListNoticeSeen]);

  async function handleAdd(suggestion: SchemeSuggestion) {
    setAddedIds((prev) => new Set(prev).add(suggestion.id));
    setAddError(null);
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemeId: scheme.id,
          species: suggestion.latin_name,
          commonNames: [suggestion.common_name],
          wikimediaImageUrl: suggestion.wikimedia_image_url,
          wikimediaAttribution: suggestion.wikimedia_attribution,
        }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Couldn't add to shopping list — please try again.");
      }
    } catch (err) {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(suggestion.id);
        return next;
      });
      setAddError(err instanceof Error ? err.message : "Couldn't add to shopping list — please try again.");
    }
  }

  const featuredSuggestion = scheme.featured_plant_latin
    ? suggestions.find((s) => s.latin_name === scheme.featured_plant_latin)
    : undefined;

  // safe: app/(app)/schemes/[id]/page.tsx redirects non-complete schemes before this renders
  const narrativeBodyParagraphs = scheme.narrative_body!.split(/\n{2,}/).filter(Boolean);

  const tiers = TIER_ORDER
    .map((tier) => ({ tier, items: suggestions.filter((s) => s.tier === tier) }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <div
        className="relative o-image-display"
        style={{
          
          height: "55vh",
        }}
      >
        {heroImage ? (
          <Image
            src={heroImage}
            alt=""
            fill
            sizes="100vw"
            className=""
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-marigold" />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 60%)" }}
        />

        <Link
          href="/schemes"
          className={[buttonStyles["o-button"], buttonStyles["o-button--overlay"]].join(" ")}
        >
          ← Planting schemes
        </Link>

        <div
          className="absolute bottom-0 left-0 right-0 z-0 p-4"
          style={{ backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}
        >
          <div
            className="absolute inset-0 -z-10"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%)" }}
          />
          {/* safe: app/(app)/schemes/[id]/page.tsx redirects non-complete schemes before this renders */}
          <EditableName schemeId={scheme.id} initialName={scheme.name!} />
          {scheme.summary && (
            <p className="long-primer text-white">{scheme.summary}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 mt-6">
      {!aiNoticeSeen && (
        <AiNoticePanel>
          This scheme was generated by AI — worth a check on plant pairings and timing before relying on it.
        </AiNoticePanel>
      )}
      <div className="flex flex-col gap-4 max-w-[680px] mx-auto">
        <p className="o-type-display long-primer">{scheme.narrative_intro}</p>
        {narrativeBodyParagraphs.map((para, i) => (
          <p key={i} className="primer">{para}</p>
        ))}
      </div>

      {featuredSuggestion?.wikimedia_image_url && (
        <figure className="flex flex-col gap-1">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper-deep">
            <Image src={featuredSuggestion.wikimedia_image_url} alt={featuredSuggestion.common_name} fill sizes="500px" className="object-cover" />
          </div>
          <Attribution url={featuredSuggestion.wikimedia_attribution} />
        </figure>
      )}

      {addError && <p className="text-sm text-marigold">{addError}</p>}

      {!shoppingListNoticeSeen && (
        <FeatureNoticePanel>
          <CartIcon /> Tap the cart icon to add plants to your shopping list.
        </FeatureNoticePanel>
      )}

      <div className="o-stack">
        {tiers.map(({ tier, items }) => (
          <div key={tier} className="o-stack--compact">
            <h2 className="long-primer kirk o-type-display">{TIER_LABELS[tier]}</h2>
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence initial={false}>
                {items.map((s) => (
                  <SuggestionCard key={s.id} suggestion={s} added={addedIds.has(s.id)} onAdd={handleAdd} />
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
