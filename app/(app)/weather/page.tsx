import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WeatherLocation } from "@/components/weather/WeatherLocation";
import type { Garden } from "@/lib/types";

export const metadata: Metadata = {
  title: "Weather | Plotted",
};

export default async function WeatherPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

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
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-medium text-2xl text-ink">Weather</h1>
      <WeatherLocation initialGarden={garden} />
    </div>
  );
}
