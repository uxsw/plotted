import { createClient } from "@/lib/supabase/server";
import { WeatherLocation } from "@/components/weather/WeatherLocation";
import type { Garden } from "@/lib/types";

export default async function WeatherSection() {
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

  return (
    <section aria-label="Garden weather" className="c-weather-section">
      <h2 className="pica o-type-display kirk u-pad-inline">Garden weather</h2>
      <WeatherLocation initialGarden={data as Garden | null} />
    </section>
  );
}
