import type { Metadata } from "next";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import ShoppingList from "@/components/ShoppingList";
import { toShoppingListItemData, type ShoppingListItemData } from "@/lib/shopping-list";
import {
  claimWaitingLookups,
  runClaimedLookup,
  userClientForBackground,
} from "@/lib/shopping-lookup/run";

export const metadata: Metadata = {
  title: "Shopping list | Plotted",
};

// Covers this page's render and every Server Action called from it — which
// is where the background name lookups run, in after(). One lookup is held
// to about 45s (lib/shopping-lookup/lookup.ts); this leaves room above that.
export const maxDuration = 90;

export default async function ShoppingListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: items } = await supabase
    .from("shopping_list_items")
    .select("*, schemes(id, name)")
    .order("created_at", { ascending: false });

  const rows = items ?? [];

  // Pick up manual items that have never had a lookup: anything captured
  // before lookups existed, anything queued behind the per-user limit, and
  // anything whose own after() never ran. Oldest first, a few at a time —
  // the list polls while any are waiting, so the queue drains itself.
  const waiting = rows
    .filter((item) => item.source === "manual" && item.lookup_status == null)
    .map((item) => item.id)
    .reverse();

  if (user && waiting.length > 0) {
    try {
      // Created now, during render: after() in a Server Component may not
      // touch the cookie store, so the background work gets its own client.
      const db = await userClientForBackground(supabase);
      const claims = db ? await claimWaitingLookups(supabase, user.id, waiting) : [];
      if (db && claims.length > 0) {
        after(() => Promise.all(claims.map((claim) => runClaimedLookup(db, user.id, claim))));
        for (const claim of claims) {
          const row = rows.find((item) => item.id === claim.id);
          if (row) {
            row.lookup_status = "pending";
            row.lookup_requested_at = claim.token;
          }
        }
      }
    } catch (err) {
      console.error("[shopping-list] lookup pickup failed:", err);
    }
  }

  const mapped: ShoppingListItemData[] = rows.map((item) => {
    const thumbnailUrl = item.thumbnail_storage_path
      ? supabase.storage.from("plant-photos").getPublicUrl(item.thumbnail_storage_path).data.publicUrl
      : null;

    return toShoppingListItemData(item, thumbnailUrl);
  });

  return (
    <div className="o-stack">
      <h1 className="pica o-type-display kirk">Shopping list</h1>
      <ShoppingList initialItems={mapped} />
    </div>
  );
}
