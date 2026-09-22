/* ──────────────────────────────────────────────────────────────────────────
   PLANTING SCHEMES HUB — "One Task, One Page"        seed: de9b55af → 2

   THESIS  A gardener opening /plant-scheme wants one of two things: start a
   new scheme, or go back to one they already have. Showing both a full
   browsing grid and the full starting UI at once — the original "workbench"
   two-column build — made every visit do double duty, competing for
   attention whichever the gardener actually came for. This revision keeps
   the single page (still no A/B door, no picker step) but makes starting the
   one job: a light "Recent plans" glance up top, everything else in
   /plant-scheme/plans, one column throughout.

   OWN-WORLD  Plotted's paper ground, hairlines and white raised sheets. The
   start panel is the page's blank sheet with a spring-washed head (a border
   just beginning); recent plans stay the photo-led catalogue idiom, scaled
   down to a glance.

   STORY  A new gardener sees what a scheme is and starts one without leaving
   the page. A returning gardener sees their last few plans first, then the
   same starting panel — "View all" is one tap away, never in the way.

   LAYOUT  Single column, always — no breakpoint reflows the page into two.
   Title and lead; Recent plans (up to three, "View all →" to the full
   list); Plan a new scheme. On mobile the recent row is a horizontal
   scroller (the app's established idiom, e.g. the dashboard's card
   scrollers); it resolves into a plain row from --breakpoint-tablet, since
   three cards are never worth a scroll affordance once there's room to
   just show them.

   Carry on drafts (SHOW_DRAFTS below) are switched off while nothing
   persists yet — commented out, not deleted. When reactivated they belong
   inside the Recent row (interleaved by recency with finished plans, not a
   shelf of their own) — the "in progress" half of "recently created or in
   progress" this row is named for.

   FIRST RUN (no drafts, no plans, no error — `is-first-run`): nothing to
   glance at yet, so Recent plans doesn't render at all. The page narrows
   further, to a focused single-task measure — the start panel, full stop.

   There used to be a folded "how a scheme comes together" walkthrough
   beneath the start panel here (HowItWorks.tsx for first run,
   SchemeExample.tsx once a gardener had plans) — removed once the welcome
   dialog below covered the same ground for the audience that actually
   needed it (a first-time gardener), at the point they most needed it
   (before they've started), rather than as a standing disclosure nobody
   who already understood the product had reason to open.

   WELCOME DIALOG  A genuinely first-time gardener (needsSchemeOnboarding,
   page.tsx) meets OnboardingCarousel's three-step walkthrough, up front and
   forced rather than opt-in — as a dialog over this page, not a separate
   one. The hub is already rendered underneath; dismissing it (the CTA,
   Escape, the backdrop) reveals the page they were already on rather than
   navigating anywhere. One-time only — see SchemeWelcomeDialog.tsx.

   FORM  Single-column task page, revised from the original two-column
   workbench (surface round, seed de9b55af) at the gardener's request.

   FINISH  unreviewed and undocumented is unfinished; this build ends with the
   finish review, the verdict, DESIGN.md, and every shipping raster carrying
   its provenance
   ────────────────────────────────────────────────────────────────────────── */

import clsx from "clsx";
import type { SchemeSummary } from "@/components/SchemeList";
import StartPanel, { type PickerPlant } from "./StartPanel";
// import DraftShelf from "./DraftShelf";
import RecentPlans from "./RecentPlans";
import SchemeWelcomeDialog from "./SchemeWelcomeDialog";
import type { SchemeDraft } from "./mockDrafts";

/** Carry-on drafts are mocked (nothing persists yet — see mockDrafts.ts) and
 *  switched off while work is focused on the first-run journey. Flip back
 *  on to resume that thread; nothing below it needs to change. */
const SHOW_DRAFTS = false;

export default function SchemesHub({
  plants,
  drafts,
  plans,
  plansError,
  showWelcome,
  welcomeIsPreview,
}: {
  /** null when the garden read failed (not the same as an empty garden). */
  plants: PickerPlant[] | null;
  drafts: SchemeDraft[];
  plans: SchemeSummary[];
  plansError: string | null;
  /** True for a genuinely first-time gardener — see needsSchemeOnboarding. */
  showWelcome: boolean;
  /** True only for the ?welcome=1 preview override — skips marking it seen. */
  welcomeIsPreview: boolean;
}) {
  const hasDrafts = SHOW_DRAFTS && drafts.length > 0;
  const hasPlans = plans.length > 0;
  /* Nothing to browse yet: no in-progress draft, no finished plan, and the
     read didn't merely fail — see the FIRST RUN note above. */
  const firstRun = !hasDrafts && !hasPlans && !plansError;

  return (
    <div className={clsx("c-scheme-hub", hasDrafts && "has-drafts", firstRun && "is-first-run")}>
      {showWelcome && <SchemeWelcomeDialog markSeen={!welcomeIsPreview} />}

      <header className="c-scheme-hub__head">
        <h1 className="paragon o-type-display kirk">Planting schemes</h1>
        <p className="primer c-scheme-hub__lead">
          {firstRun
            ? "Plan a border around a few plants with Plotted."
            : "Plan a border around a few plants with Plotted, or go back to a finished plan."}
        </p>
      </header>

      {/* Carry on — see SHOW_DRAFTS above. Once real, these interleave into
          RecentPlans by recency rather than getting a shelf of their own.
      {hasDrafts && (
        <section className="c-scheme-hub__section is-drafts" aria-labelledby="scheme-hub-drafts">
          <h2 id="scheme-hub-drafts" className="pica o-type-display kirk">
            Carry on
          </h2>
          <DraftShelf drafts={drafts} />
        </section>
      )}
      */}

      {!firstRun && <RecentPlans plans={plans} plansError={plansError} />}

      <StartPanel plants={plants} />
    </div>
  );
}
