"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeletePlantButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("plants").delete().eq("id", id);
    if (error) {
      setError("Could not delete plant. Please try again.");
      return;
    }
    router.push("/plants");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={handleDelete}
        className="text-sm bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  );
}
