"use client";

import { useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import * as Popover from "@radix-ui/react-popover";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PlaceholderSchemeCard } from "@/components/ui/PlaceholderSchemeCard";
import buttonStyles from "@/components/ui/Button.module.css";

export type SchemeSummary = {
  id: string;
  status: "complete" | "failed";
  name: string | null;
  summary: string | null;
  narrative_intro: string | null;
  created_at: string;
  suggestion_count: number;
  source_plant_photos: string[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ThumbnailStack({ photos }: { photos: string[] }) {
  const shown = photos.slice(0, 5);
  return (
    <div className="is-stack">
      {shown.map((url, i) => (
        <div
          key={i}
          className="is-frame"
          style={{ width: "19%", marginLeft: i === 0 ? 0 : "-5%", zIndex: shown.length - i }}
        >
          <Image src={url} alt="" fill sizes="15vw" className="is-image" />
        </div>
      ))}
    </div>
  );
}

function MoreIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="8" cy="3" r="1.4" />
      <circle cx="8" cy="8" r="1.4" />
      <circle cx="8" cy="13" r="1.4" />
    </svg>
  );
}

function SchemeCard({
  scheme,
  onRenamed,
  onDeleted,
}: {
  scheme: SchemeSummary & { name: string };
  onRenamed: (id: string, name: string) => void;
  onDeleted: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(scheme.name);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function commitRename() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === scheme.name) {
      setNameValue(scheme.name);
      setRenaming(false);
      return;
    }
    setRenaming(false);
    setError(null);
    try {
      const res = await fetch(`/api/schemes/${scheme.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
      onRenamed(scheme.id, trimmed);
    } catch {
      setNameValue(scheme.name);
      setError("Could not rename — please try again.");
    }
  }

  async function doDelete() {
    setDeleteOpen(false);
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/schemes/${scheme.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDeleted(scheme.id);
    } catch {
      setError("Could not delete — please try again.");
      setDeleting(false);
    }
  }

  const cardBody = (
    <>
      <div className="scheme-media">
        {scheme.source_plant_photos[0] && (
          <Image
            src={scheme.source_plant_photos[0]}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="is-image"
          />
        )}
        <div className="c-scheme__thumbnail-stack">
          {scheme.source_plant_photos.length > 0 ? (
            <ThumbnailStack photos={scheme.source_plant_photos} />
          ) : (
            <div className="w-16 h-16 text-sand-line">
              <SchemeIllustration />
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 p-4 flex-1">
        {renaming ? (
          <input
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commitRename(); }
              if (e.key === "Escape") { setNameValue(scheme.name); setRenaming(false); }
            }}
            className="font-display font-medium text-base text-ink leading-snug bg-transparent border-b border-marigold outline-none w-full"
          />
        ) : (
          <h3 className="o-type-display long-primer kirk o-type-leading--tight">{nameValue}</h3>
        )}
        <p className="minion">{formatDate(scheme.created_at)}</p>
        {scheme.summary && (
          <p className="brevier">{scheme.summary}</p>
        )}
        <div className="u-margin-top-auto">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium font-sans leading-none bg-marigold text-ink">
            {scheme.suggestion_count} suggestion{scheme.suggestion_count === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <div className={`relative ${deleting ? "opacity-50 pointer-events-none" : ""}`}>
      {renaming ? (
        <div>{cardBody}</div>
      ) : (
        <Link
          href={`/schemes/${scheme.id}`}
          className="o-card o-card--interactive"
        >
          {cardBody}
        </Link>
      )}

      <div className="absolute top-2 right-2 z-10">
        <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              aria-label="Scheme options"
              className="w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <MoreIcon />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="end"
              sideOffset={6}
              className="o-popover"
            >
              <button
                type="button"
                onClick={() => { setMenuOpen(false); setRenaming(true); }}
                className="o-popover__link brevier"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
                className="o-popover__link brevier is-danger"
              >
                Delete
              </button>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      {error && <p className="o-surface--error u-island--compact brevier">{error}</p>}

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={doDelete}
        title="Delete this scheme?"
        message={`"${scheme.name}" will be permanently removed, including its suggestions. This can't be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

function FailedSchemeCard({
  scheme,
  onDeleted,
}: {
  scheme: SchemeSummary;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function doRetry() {
    setRetrying(true);
    setRetryError(null);
    try {
      const res = await fetch(`/api/schemes/${scheme.id}/retry`, { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setRetryError("Couldn't retry — please try again.");
      setRetrying(false);
    }
  }

  async function doDelete() {
    setDeleteOpen(false);
    setDeleting(true);
    try {
      const res = await fetch(`/api/schemes/${scheme.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDeleted(scheme.id);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div
      className={`relative flex flex-col overflow-hidden border transition-opacity duration-150 ${deleting ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="relative h-[190px] w-full overflow-hidden">
        {scheme.source_plant_photos[0] && (
          <Image
            src={scheme.source_plant_photos[0]}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover scale-110 blur-md"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          {scheme.source_plant_photos.length > 0 ? (
            <ThumbnailStack photos={scheme.source_plant_photos} />
          ) : (
            <div className="w-16 h-16">
              <SchemeIllustration />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 flex-1">
        <p className="font-sans text-sm text-ink-soft leading-snug">
          {retrying ? "Trying again…" : "This scheme couldn't be generated."}
        </p>
        {retryError && <p className="font-sans text-xs text-marigold">{retryError}</p>}
        {!retrying && (
          <button
            type="button"
            onClick={doRetry}
            className={clsx(
              buttonStyles["o-button"],
              buttonStyles["o-button--primary"],
            )}
          >
            Try again
          </button>
        )}
        <p className="font-sans text-xs text-ink-soft">{formatDate(scheme.created_at)}</p>
      </div>

      <button
        type="button"
        aria-label="Dismiss this failed scheme"
        onClick={() => setDeleteOpen(true)}
        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white text-base leading-none"
      >
        ×
      </button>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={doDelete}
        title="Dismiss this failed scheme?"
        message="This failed attempt will be removed, including the original plant selection. This can't be undone."
        confirmLabel="Dismiss"
        variant="danger"
      />
    </div>
  );
}

export default function SchemeList({ schemes: initialSchemes }: { schemes: SchemeSummary[] }) {
  const router = useRouter();
  const [schemes, setSchemes] = useState(initialSchemes);

  function handleRenamed(id: string, name: string) {
    setSchemes((cur) => cur.map((s) => (s.id === id ? { ...s, name } : s)));
  }

  function handleDeleted(id: string) {
    setSchemes((cur) => cur.filter((s) => s.id !== id));
  }

  if (schemes.length === 0) {
    return (
      <div className="o-card-grid">
        <button
          type="button"
          onClick={() => router.push("/schemes/new")}
          className="c-first-plant-card"
        >
          <div className="c-first-plant-card__media">
            <PlusIcon />
          </div>
          <div className="u-island--compact">
            <h3 className="o-type-display long-primer kirk">
              Create your first scheme
            </h3>
            <p className="brevier">
              Pick a few plants to get companion suggestions.
            </p>
          </div>
        </button>
        <PlaceholderSchemeCard opacity={0.5} />
        <PlaceholderSchemeCard opacity={0.3} />
      </div>
    );
  }

  return (
    <div className="o-card-grid">
      {schemes.map((scheme) =>
        scheme.status === "failed" ? (
          <FailedSchemeCard key={scheme.id} scheme={scheme} onDeleted={handleDeleted} />
        ) : (
          <SchemeCard
            key={scheme.id}
            scheme={scheme as SchemeSummary & { name: string }}
            onRenamed={handleRenamed}
            onDeleted={handleDeleted}
          />
        )
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      className="w-8 h-8 text-marigold"
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

function SchemeIllustration() {
  return (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path
        d="M24 78V50M24 50C24 50 17 44 17 34M24 50C24 50 31 44 31 34"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M48 78V38M48 38C48 38 39 30 39 18M48 38C48 38 57 30 57 18"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M72 78V54M72 54C72 54 65 48 65 40M72 54C72 54 79 48 79 40"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M12 78h72" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
