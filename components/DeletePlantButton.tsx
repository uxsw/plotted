"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export default function DeletePlantButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doDelete() {
    setError(null);
    setOpen(false);
    const supabase = createClient();
    const { error } = await supabase.from("plants").update({ status: "removed" }).eq("id", id);
    if (error) {
      setError("Could not delete plant. Please try again.");
      return;
    }
    router.push("/plants");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-xs text-clay">{error}</p>}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Delete plant"
        title="Delete plant"
        className="flex items-center justify-center w-9 h-9 rounded text-ink-soft transition-colors duration-150 hover:bg-clay-tint hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <TrashIcon />
      </button>
      <ConfirmDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={doDelete}
        title="Delete this plant?"
        message={`"${name}" will be permanently removed from your collection. This can't be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
