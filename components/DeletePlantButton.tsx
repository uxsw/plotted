"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeletePlantButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const supabase = createClient();
    await supabase.from("plants").delete().eq("id", id);
    router.push("/plants");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-sm bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded hover:bg-red-50"
    >
      Delete
    </button>
  );
}
