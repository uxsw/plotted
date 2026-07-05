# Pre-Deploy Checklist

**Status:** Adopted
**Context:** Solo dev, pre-beta, no separate staging environment. Uses Vercel Preview Deployments (automatic per-branch/PR) against production Supabase data.

## Why this exists

Plotted doesn't have a dedicated dev/staging/prod split, and doesn't need one yet — Vercel Preview Deployments already give an isolated URL per branch/PR before anything hits production. This checklist is the lightweight discipline that makes that safe: it replaces a formal staging environment with a repeatable set of checks.

Revisit the "do we need real staging" question if either becomes true:
- A second user's data is at risk (not just John's own)
- Schema migrations become risky/destructive enough that testing against a copy of prod data matters

## Environment notes specific to this stack

- **Env var scoping:** Vercel separates Preview and Production environment variable scopes. Any env var added for a new feature (e.g. a new API key) must be added to **both** scopes, not just Production — otherwise preview builds can silently fail the same way `SUPABASE_SERVICE_ROLE_KEY` did in prod.
- **Shared database:** Preview deployments hit the same production Supabase database by default. This is an accepted tradeoff at current scale — no second Supabase project — but means preview testing uses real data. Avoid creating junk test plants/records that aren't cleaned up.
- **Service role key:** Never `NEXT_PUBLIC_`-prefixed, never used client-side, in any environment.

## Checklist

### Before opening/merging a PR
- [ ] Migrations applied — new Supabase schema changes run against prod DB (or confirmed already applied)
- [ ] Env vars checked — new/changed env vars added to both Preview and Production scopes in Vercel
- [ ] RLS policies reviewed if any table/query touched ownership checks
- [ ] `lint`, `typecheck`, `build`, `test` pass locally

### On the preview deployment (before merging)
- [ ] Click through the actual feature built, not just the happy path
- [ ] Full plant-creation flow checked end to end if plants/lookup touched
- [ ] Console and network tab checked for errors
- [ ] No accidental `NEXT_PUBLIC_` exposure of sensitive values

### Before merging to main
- [ ] Preview looked right
- [ ] No leftover debug logging / console.logs
- [ ] Any destructive change (schema drops, data migrations) double-checked against prod data, not just preview

### After merging (post-deploy)
- [ ] Production URL loads, spot-check the changed feature live
- [ ] Vercel deployment logs checked for runtime errors in first few minutes
