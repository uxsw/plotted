import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LocationEditor } from "@/components/account/LocationEditor";
import type { Garden } from "@/lib/types";

export const metadata: Metadata = {
  title: "Account | Plotted",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = user
    ? await supabase
        .from("garden")
        .select("id, user_id, latitude, longitude, location_label, created_at, updated_at")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle()
    : { data: null };

  const garden = data as Garden | null;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display font-medium text-2xl text-ink">Account</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-sans font-medium uppercase tracking-wide text-ink-soft">
          Location
        </h2>
        <LocationEditor
          initialLabel={garden?.location_label ?? null}
        />
      </section>
    </div>
  );
}
