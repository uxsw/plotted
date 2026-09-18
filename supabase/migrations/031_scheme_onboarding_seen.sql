-- Add the scheme-journey onboarding "seen" flag to user_flags.
-- Null = the one-time /plant-scheme/welcome interstitial hasn't been shown
-- yet; timestamptz = it has. Follows the lookup_notice_seen_at /
-- onboarding_location_seen_at naming convention. Insert/update policies on
-- user_flags already exist (018_shopping_list_notice.sql).
ALTER TABLE user_flags
  ADD COLUMN scheme_onboarding_seen_at timestamptz;
