-- Add PWA install prompt tracking fields to user_flags.
-- pwa_prompt_dismiss_count: how many times the user has dismissed the prompt;
-- indexed into PWA_PROMPT_THRESHOLDS to determine when to re-show.
-- pwa_installed_at: set when we detect installation (or iOS walkthrough complete);
-- once set, the prompt is permanently suppressed.
ALTER TABLE user_flags
  ADD COLUMN pwa_prompt_dismiss_count integer NOT NULL DEFAULT 0,
  ADD COLUMN pwa_installed_at timestamptz;
