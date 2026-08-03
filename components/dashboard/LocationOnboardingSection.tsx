import { createClient } from "@/lib/supabase/server";
import { LocationOnboardingCard } from "@/components/dashboard/LocationOnboardingCard";

export default async function LocationOnboardingSection() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: garden }, { data: flags }] = await Promise.all([
    supabase.from("garden").select("latitude").eq("user_id", user.id).limit(1).maybeSingle(),
    supabase
      .from("user_flags")
      .select("onboarding_location_seen_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const show = garden?.latitude == null && !flags?.onboarding_location_seen_at;
  if (!show) return null;

  return <LocationOnboardingCard />;
}
