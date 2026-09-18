/**
 * The hub's "how it works" reference — three short plates, not a technical
 * walkthrough.
 *
 * Replaces SchemeExample for the true empty state (no plants, no drafts, no
 * plans). SchemeExample proves the mechanism with real working parts — a
 * live chat bubble, quick-reply chips, a border-elevation diagram, full
 * plant cards with badges and match notes — which is exactly right once a
 * gardener is genuinely evaluating the tool, but is a lot of unfamiliar UI
 * to read before they've done anything at all. Here the same three-step
 * shape is told editorially instead: one line of intent, three short
 * captioned plates. Colour and imagery carry the "a border taking shape"
 * promise — the season arc (spring → early-summer → summer) across the
 * three plates — rather than a paragraph per step.
 *
 * Shares its step content (SCHEME_ONBOARDING_STEPS) with
 * OnboardingCarousel.tsx, the fuller one-time version of the same story
 * shown in the welcome dialog — this is the compact, always-available
 * reference; that one is the one-time introduction.
 *
 * Photo wells are placeholders: a season-washed field, one line mark, a
 * dashed edge — the app's existing "not filled in yet" grammar (ghost rows,
 * ghost silhouettes), not invented chrome. Pass `photoSrc` on a STEP once
 * real photography exists; the placeholder is what renders until then.
 *
 * Deliberately non-interactive, like SchemeExample — proof, not a demo.
 *
 * Styles: `.c-scheme-teaser` in styles/components/_scheme-hub.scss.
 */

import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { SCHEME_ONBOARDING_STEPS } from "./schemeOnboardingSteps";

export default function HowItWorks() {
  return (
    <div className="c-scheme-teaser">
      <p className="long-primer o-type-display o-type--italic c-scheme-teaser__lead">
        Three steps. One border that&apos;s genuinely yours.
      </p>

      {/* Break out of the 40rem first-run measure — the photography earns
          real width the moment curiosity is opted into (see the SCSS). */}
      <div className="c-scheme-teaser__stage">
        <div className="c-scheme-teaser__plates">
          {SCHEME_ONBOARDING_STEPS.map((step) => (
            <figure key={step.n} className={`c-scheme-teaser__plate is-${step.accent}`}>
              <div className="c-scheme-teaser__mat">
                <div className="c-scheme-teaser__frame">
                  {step.photoSrc ? (
                    <Image
                      src={step.photoSrc}
                      alt={step.photoAlt ?? ""}
                      fill
                      sizes="(max-width: 40rem) 90vw, 20rem"
                      className="c-scheme-teaser__photo-img"
                    />
                  ) : (
                    <div className="c-scheme-teaser__placeholder" aria-hidden="true">
                      <Icon name={step.icon} size={40} />
                    </div>
                  )}
                </div>
              </div>
              <figcaption className="c-scheme-teaser__caption">
                <span className="primer o-type-display o-type--italic">{step.title}</span>
                <span className="o-type-label c-scheme-teaser__no" aria-hidden="true">
                  {step.n}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
