/* ──────────────────────────────────────────────────────────────────────────
   PLANTING SCHEMES HUB — "The Workbench"             seed: de9b55af

   THESIS  Planting schemes are one bench, not a corridor. Starting a scheme,
   carrying on with a draft and reopening a finished plan share one wide page,
   refusing the old gallery → A/B door → picker → chat hand-offs.

   OWN-WORLD  Plotted's paper ground, hairlines and white raised sheets. The
   start panel is the page's blank sheet with a spring-washed head (a border
   just beginning); drafts wear a summer wash and their own half-drawn border
   elevation; finished plans stay the photo-led catalogue cards.

   STORY  A new gardener sees what a scheme is and starts one without leaving
   the page. A returning gardener finds their drafts first, then their plans.

   FIRST VIEWPORT  ≥60rem: title and one-line lead across the top; Finished
   plans in the left column; an equal-width sticky start panel on the right
   (starting tray with the primary Start directly under it, then
   type-any-name, then garden plants). Narrow: title → start → plans.

   Carry on drafts (SHOW_DRAFTS below) are switched off while focus is on
   the first-run journey — commented out, not deleted, so the shelf and its
   mock data are ready to switch back on.

   FIRST RUN (no drafts, no plans, no error — `is-first-run`): the two-column
   workbench is a browsing surface, and a brand-new gardener has nothing to
   browse yet, so it collapses to one centred column at a focused measure —
   the start panel, full stop. "How it works" moves below it, closed by
   default behind a plain disclosure link, so the first thing a new user
   meets is the task, not a second dense panel competing for equal
   attention. It reopens the moment there's something to show (a plan or,
   later, a draft) and the page returns to the workbench.

   Opened, it is HowItWorks — an editorial triptych, not SchemeExample's
   working UI fragments: one aspirational line, three short season-washed
   plates (spring → early-summer → summer), imagery over paragraphs. It
   breaks the 40rem first-run measure on purpose — photography earns the
   room the task column doesn't need — via a centred, capped (64rem)
   breakout, the page visibly "opening up" the moment curiosity is opted
   into.

   WELCOME DIALOG  A genuinely first-time gardener (needsSchemeOnboarding,
   page.tsx) meets the same HowItWorks content once more, up front and
   forced rather than opt-in — as a dialog over this page, not a separate
   one. The hub is already rendered underneath; dismissing it (the CTA,
   Escape, the backdrop) reveals the page they were already on rather than
   navigating anywhere. The collapsed disclosure above stays put for anyone
   who wants the reminder again later — the dialog is one-time, the
   reference isn't.

   FORM  Workbench, 2nd of 7 grounded structures (surface round, seed
   de9b55af); picked by Claude at the gardener's request.

   FINISH  unreviewed and undocumented is unfinished; this build ends with the
   finish review, the verdict, DESIGN.md, and every shipping raster carrying
   its provenance
   ────────────────────────────────────────────────────────────────────────── */

import clsx from "clsx";
import SchemeList, { type SchemeSummary } from "@/components/SchemeList";
import { Icon } from "@/components/ui/Icon";
import StartPanel, { type PickerPlant } from "./StartPanel";
// import DraftShelf from "./DraftShelf";
import SchemeExample from "./SchemeExample";
import HowItWorks from "./HowItWorks";
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
     read didn't merely fail. The workbench has nothing to be a workbench
     for, so it isn't one — see the FIRST RUN note above. */
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

      <div className="c-scheme-hub__start">
        <StartPanel plants={plants} />
      </div>

      {/* Carry on — see SHOW_DRAFTS above.
      {hasDrafts && (
        <section className="c-scheme-hub__section is-drafts" aria-labelledby="scheme-hub-drafts">
          <h2 id="scheme-hub-drafts" className="pica o-type-display kirk">
            Carry on
          </h2>
          <DraftShelf drafts={drafts} />
        </section>
      )}
      */}

      {firstRun ? (
        /* Opt-in, not opt-out: closed by default so the first thing a new
           gardener meets is the task above, not a second illustrated panel
           claiming equal attention. */
        <div className="c-scheme-hub__teaser">
          <details className="c-scheme-hub__example">
            <summary className="brevier">
              See how a scheme comes together
              <Icon name="arrowDown" size={14} className="c-scheme-hub__example-arrow" />
            </summary>
            <HowItWorks />
          </details>
        </div>
      ) : (
        <section className="c-scheme-hub__section is-plans" aria-labelledby="scheme-hub-plans">
          {plansError ? (
            <>
              <h2 id="scheme-hub-plans" className="pica o-type-display kirk">
                Finished plans
              </h2>
              <p className="brevier c-scheme-hub__error" role="alert">
                Couldn&apos;t load your plans ({plansError}). Try refreshing the page.
              </p>
            </>
          ) : hasPlans ? (
            <>
              <h2 id="scheme-hub-plans" className="pica o-type-display kirk">
                Finished plans
              </h2>
              <SchemeList
                key={plans.map((s) => `${s.id}:${s.status}`).join(",")}
                schemes={plans}
              />
              <details className="c-scheme-hub__example">
                <summary className="brevier">
                  How a scheme comes together
                  <Icon name="arrowDown" size={14} className="c-scheme-hub__example-arrow" />
                </summary>
                <SchemeExample />
              </details>
            </>
          ) : (
            // hasDrafts true, no plans yet — dead while SHOW_DRAFTS is off.
            <>
              <div className="c-scheme-hub__intro">
                <h2 id="scheme-hub-plans" className="pica o-type-display kirk">
                  How a scheme comes together
                </h2>
                <p className="brevier">
                  Finished plans will appear here. Until then, this is the shape a scheme
                  takes.
                </p>
              </div>
              <SchemeExample />
            </>
          )}
        </section>
      )}
    </div>
  );
}
