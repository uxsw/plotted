# Onboarding: Confirmation Flow + Email Templates

Two Claude Code prompts, run in sequence, plus a manual Supabase Dashboard checklist for the parts that can't be automated. Review the diff from Prompt 1 before starting Prompt 2 — they touch related but separate concerns.

---

## Prompt 1: `/auth/confirm` route handler + `/welcome` page

```
CONTEXT
Plotted (plotted.garden) is a Next.js App Router + TypeScript + Supabase app.
Auth emails (signup confirmation, invite, email change, magic link) currently
use Supabase's default {{ .ConfirmationURL }}, which routes through
Supabase's own /auth/v1/verify endpoint on supabase.co before redirecting
back to our Site URL. This cross-domain redirect chain is the same pattern
that previously wiped the PKCE code verifier cookie during password reset
(browser bounce-tracking protection in Chrome/Safari) — we fixed that for
password recovery with a 6-digit OTP flow, but signup/invite/email-change
confirmation links still use the vulnerable ConfirmationURL pattern.

The fix: verify the token ourselves via a same-domain route handler using
Supabase's verifyOtp() with a token_hash, eliminating the supabase.co hop
entirely. This also gives us a hook to redirect new signups to a proper
welcome/next-steps page instead of dumping them on plotted.garden.

Note: password recovery already has its own OTP flow — do not touch it.
This work is scoped to signup, invite, email_change, and magiclink
confirmation types only.

PRE-FLIGHT CHECKS (do these first, report findings before making changes)
1. Find and show the current Supabase client setup (browser + server clients)
   — confirm flowType config and where cookies are handled.
2. Search the repo for any existing /auth/callback or /auth/confirm route —
   confirm there's no collision or existing partial implementation.
3. Show the current post-login redirect logic that unifies auth paths to
   /dashboard — this pattern should be reused for the "already logged in,
   just landed here" case (e.g. email_change, magiclink) rather than
   duplicated.
4. Confirm how the server-side Supabase client is instantiated in Route
   Handlers in this codebase (cookie adapter pattern) so verifyOtp() runs
   in a context that can actually set the session cookie.
5. Report back: does supabase-js's verifyOtp() in this project's installed
   version accept token_hash + type directly, or do we need the older
   token + email + type shape? Confirm against package.json's
   @supabase/supabase-js version and current Supabase JS docs if uncertain.

CHANGES
1. Create a Route Handler at app/auth/confirm/route.ts (GET) that:
   - Reads token_hash and type from searchParams (type is one of Supabase's
     EmailOtpType values: signup, invite, email_change, magiclink — NOT
     recovery).
   - Calls supabase.auth.verifyOtp({ token_hash, type }) using the
     server-side client so the resulting session cookie is set correctly.
   - On success:
     - If type is 'signup' or 'invite', redirect to /welcome.
     - For all other types, redirect to /dashboard (reuse the existing
       unified redirect logic from pre-flight check #3 rather than a new
       path).
   - On failure (expired/invalid token), redirect to a clear error state —
     reuse existing error/auth UI patterns if any exist, otherwise a plain
     message with a link back to sign in. Do not expose raw Supabase error
     text to the user.
   - Missing or malformed token_hash/type params should fail the same way
     as a verification failure, not throw an unhandled error.

2. Create app/welcome/page.tsx:
   - Server component. If there's no active session when this page loads
     directly (i.e. someone bookmarks/shares the URL), redirect to
     /dashboard or /login as appropriate — don't show it as an orphaned
     page.
   - Content: confirmation message ("you're in" / account confirmed), 2-3
     short lines of next-step guidance, one primary CTA button to
     /dashboard. Do NOT build a login form on this page — the user already
     has a session from the route handler, so a direct dashboard link is
     sufficient and avoids a second auth entry point.
   - Mark ALL user-facing copy on this page with a // TODO: Natalie —
     placeholder copy for review comment. Keep the copy minimal and
     functional for now, not final.
   - Follow existing page/layout conventions (styling approach, IBM Plex
     usage, whatever the dashboard page already does) rather than
     introducing new patterns.

DO NOT TOUCH
- The existing password recovery OTP flow or its routes/components.
- The /auth/reset-password route (already flagged as deferred cleanup,
  separate piece of work).
- Supabase Dashboard email template content — that's a manual step done
  separately, not part of this diff.
- Any other auth entry points (login form, signup form) beyond what's
  needed to reuse the existing post-login redirect logic.

EFFORT ESTIMATE
Small-medium. One route handler, one page, reuse of existing redirect
patterns. Should be a single reviewable diff.

DELIVERABLE
Diff for review, not auto-merged. Flag any assumptions made about the
verifyOtp() call shape or cookie handling explicitly in your summary so
they can be checked against the actual Supabase JS version in use.
```

---

## Prompt 2: React Email template for confirmation

Run this **after** Prompt 1 is reviewed and merged, so the route handler's URL shape (`/auth/confirm?token_hash=...&type=signup`) already exists to link to.

```
CONTEXT
Plotted currently uses Supabase's default plain-text-style confirmation
email, edited directly in the Supabase Dashboard. We want to move to
React Email components so templates are source-controlled, reusable, and
testable locally, rendered to static HTML for Supabase to consume.

Supabase's email templates are Go templates using variables like
{{ .ConfirmationURL }}, {{ .Token }}, {{ .TokenHash }}, {{ .SiteURL }},
{{ .Email }}. These must appear as literal, unescaped text in the final
rendered HTML output — they are NOT React props, they're placeholder
strings Supabase itself substitutes at send time.

Supabase supports sourcing templates from local HTML files for local dev
via supabase/config.toml (auth.email.template.<name>.content_path), which
get tested against Inbucket. For production (hosted dashboard), the
rendered HTML still has to be manually pasted into the Dashboard's Email
Templates page — there's no CLI push to prod for this. This prompt should
produce the local-dev-testable artifact; pasting into the Dashboard is a
manual step outside this diff.

PRE-FLIGHT CHECKS (do these first, report findings before making changes)
1. Check package.json for react-email, @react-email/components, and resend
   — confirm what's already installed vs what needs adding.
2. Check whether supabase/config.toml already exists in the repo and what,
   if anything, it currently configures for auth.email templates.
3. Check whether a supabase/templates/ directory already exists.
4. Confirm existing design tokens (colours, font families/IBM Plex setup,
   spacing) that should be reused for brand consistency — report where
   these live (e.g. SCSS tokens, tailwind config) since email HTML can't
   consume them directly (inline styles only) but values should match.

CHANGES
1. Add react-email and @react-email/components as dev dependencies.
2. Create an emails/ directory (or similar, matching repo conventions) with
   ConfirmationEmail.tsx — a React Email component:
   - Inline-styled only (no <style> blocks — strip per React Email's
     defaults, don't fight this).
   - Uses IBM Plex font stack with web-safe fallback (custom fonts are
     unreliable in email clients — fallback matters here).
   - Single clear CTA button linking to a literal placeholder string:
     {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
   - Include a plain-text fallback link below the button (visible text URL,
     not just an href) for clients that strip buttons/HTML.
   - Keep image use minimal — Supabase's own SMTP best-practice guidance
     recommends reducing images in auth emails; we're on Resend so this is
     about deliverability hygiene, not a hard platform limit.
   - Mark all copy with a // TODO: Natalie comment — this is placeholder
     copy, not final.
3. Add a render script (npm script, e.g. `email:build`) that renders
   ConfirmationEmail.tsx to static HTML via @react-email/render and writes
   it to supabase/templates/confirmation.html. Confirm the Go template
   variables above survive the render step as literal text, not escaped
   or stripped — this is the main risk in this prompt, verify it explicitly
   and report the actual rendered output in your summary.
4. Add/update supabase/config.toml with:
   [auth.email.template.confirmation]
   subject = "..." (placeholder, flag for Natalie)
   content_path = "./supabase/templates/confirmation.html"
5. Add a short README note (or CLAUDE.md entry, whichever fits existing
   docs conventions) documenting: run `email:build` after editing the
   component, test locally via `supabase start` + Inbucket, then manually
   paste the rendered HTML into the Dashboard for production.

DO NOT TOUCH
- The password recovery OTP email template — out of scope, working
  correctly already.
- Other Supabase templates (invite, magic link, email change) — this pass
  is confirmation/signup only. Structure the render script so adding more
  templates later is easy, but don't build them now.
- Actual email sending/SMTP configuration — Resend/SMTP setup is already
  done; this is template content only.

EFFORT ESTIMATE
Medium. New dependency, one component, one render script, config wiring.
Mostly scaffolding — reasonable to do in one sitting.

DELIVERABLE
Diff for review. Include the actual rendered HTML output (or a snippet of
it) in your summary so the Go template variable substitution can be
visually verified before this goes anywhere near Supabase.
```

---

## Manual steps in Supabase Dashboard (not automatable — this is the handholding part)

Do these **after** both diffs are merged and deployed:

1. **Test locally first if you can.** `supabase start`, trigger a signup, check Inbucket (usually `http://localhost:54324`) to see the rendered email and confirm the link points at `/auth/confirm?token_hash=...&type=signup` correctly.

2. **Update the production template.** Supabase → Authentication → Email Templates → Confirm signup. Paste the rendered HTML from `supabase/templates/confirmation.html` into the body field, and update the subject line (once Natalie's signed off on copy).

3. **Double-check the Redirect URL allowlist** — Authentication → URL Configuration. Because this approach links directly to your own domain (`{{ .SiteURL }}/auth/confirm`) rather than through Supabase's `{{ .ConfirmationURL }}` redirect chain, Supabase itself never performs a redirect here, so this *may not need a new allowlist entry at all*. Worth verifying by testing rather than assuming — if the flow works end-to-end in step 4 without adding anything, you're fine. If you hit a redirect-blocked error, add `https://plotted.garden` and `https://www.plotted.garden` explicitly (the www gap has bitten before).

4. **Test end-to-end in both Chrome and Safari**, same as the password reset fix — click through from an actual received email, not just a copy-pasted link, since bounce-tracking protections behave differently across browsers and only show up on the real flow.

5. **Repeat for Invite and Magic Link templates** once you're happy with Confirm signup — same HTML structure, different subject/copy, low effort once the pipeline's proven.

Natalie's copy review should happen before step 2 (production paste), not after — easier to update the source component than to hand-edit the Dashboard later.
