-- Conversational planting scheme (/plant-scheme): per-user hourly cap on chat
-- turns, each of which is a real model call. Abuse protection at private-beta
-- scale, not a quota system — same shape as the daily identification counter
-- (028): scheme_turn_window_start marks when the current hour's count began,
-- so a window rollover is a plain reset rather than needing a cron job.
ALTER TABLE user_flags
  ADD COLUMN scheme_turn_count integer NOT NULL DEFAULT 0,
  ADD COLUMN scheme_turn_window_start timestamptz;
