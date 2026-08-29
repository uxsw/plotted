"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { buttonStyles } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

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
      {error && <p className="minion text-marigold">{error}</p>}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Delete plant"
        title="Delete plant"
        className={[
          buttonStyles["o-button"],
          buttonStyles["o-button--ghost-danger"],
          buttonStyles["o-button--icon"],
        ].join(" ")}
      >
        <Icon name="delete" aria-label="Delete" />
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
