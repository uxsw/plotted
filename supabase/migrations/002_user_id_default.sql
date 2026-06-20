-- Remove the client-supplied user_id from the trust chain.
-- The database now defaults user_id to the authenticated session's uid,
-- so the insert payload no longer needs to include it.
ALTER TABLE plants ALTER COLUMN user_id SET DEFAULT auth.uid();
