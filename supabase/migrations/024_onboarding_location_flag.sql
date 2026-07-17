-- Add onboarding location flag to user_flags.
-- Null = not yet seen; timestamptz = dismissed or completed.
-- Follows the lookup_notice_seen_at / pwa_installed_at naming convention.
ALTER TABLE user_flags
  ADD COLUMN onboarding_location_seen_at timestamptz;
