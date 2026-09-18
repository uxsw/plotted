"use client";

/**
 * The welcome dialog's carousel — one step at a time, not a grid of three.
 * A dialog is a moment of focused attention a gardener can't be assumed to
 * give for long, so each of the three steps gets the whole panel to itself:
 * a big Image Plate, a real headline, one supporting sentence. Content is
 * SCHEME_ONBOARDING_STEPS — shared with HowItWorks.tsx, the hub's own
 * compact reference to the same three steps.
 *
 * Built on the app's existing carousel primitives rather than a bespoke
 * drag implementation: a native CSS scroll-snap track (the same mechanic
 * `.c-carousel` already uses for the dashboard's card scrollers, here at
 * one-slide-per-view instead of a peeking multi-card strip) plus the
 * established `o-carousel__position` dot styling. Native scroll-snap means
 * a real touch swipe on mobile for free, no gesture library — the strongest
 * presentation this journey has, matching the brief.
 *
 * Dots are genuinely interactive here (tap to jump), on top of what the
 * dashboard scrollers do with the same class — a natural, low-risk
 * extension for a three-step sequence a gardener may want to skip back
 * through. Back/Next are the primary, self-evident navigation (mirrors the
 * app's own step-footer convention — Skip/Continue on the question flow,
 * ← Back / Continue → on the old scratch schedule); the dots are the quick
 * way, not the only way. Arrow-key navigation works from anywhere in the
 * dialog once it has focus.
 *
 * `onFinish` fires once, from the last step's primary button — the
 * "Create planting scheme" action the brief asks for. Escape, the
 * backdrop, and the dialog's own close button are the gardener's other,
 * equally-valid ways out (SchemeWelcomeDialog.tsx); this carousel doesn't
 * gate finishing on stepping through every slide.
 *
 * Styles: `.c-onboarding` in styles/components/_scheme-hub.scss.
 */

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import carouselStyles from "@/components/ui/Carousel.module.css";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";
import { SCHEME_ONBOARDING_STEPS } from "./schemeOnboardingSteps";

const TOTAL = SCHEME_ONBOARDING_STEPS.length;

export default function OnboardingCarousel({ onFinish }: { onFinish: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLast = activeIndex === TOTAL - 1;

  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), TOTAL - 1));
  }, []);

  const goTo = useCallback((index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.min(Math.max(index, 0), TOTAL - 1);
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    // The scroll event lands the real state; set it optimistically too, so
    // the dot/label update tracks the tap instead of waiting on momentum.
    setActiveIndex(clamped);
  }, []);

  function next() {
    if (isLast) {
      onFinish();
      return;
    }
    goTo(activeIndex + 1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft" && activeIndex > 0) {
      e.preventDefault();
      goTo(activeIndex - 1);
    }
  }

  return (
    <div className="c-onboarding" onKeyDown={handleKeyDown}>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="c-onboarding__track"
        role="group"
        aria-roledescription="carousel"
        aria-label="How a scheme comes together"
      >
        {SCHEME_ONBOARDING_STEPS.map((step, i) => (
          <div
            key={step.n}
            className={`c-onboarding__slide is-${step.accent}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${TOTAL}`}
            aria-hidden={i !== activeIndex}
          >
            <div className="c-onboarding__mat">
              <div className="c-onboarding__frame">
                {step.photoSrc ? (
                  <Image
                    src={step.photoSrc}
                    alt={step.photoAlt ?? ""}
                    fill
                    sizes="(max-width: 30rem) 85vw, 26rem"
                    className="c-onboarding__photo-img"
                  />
                ) : (
                  <div className="c-onboarding__placeholder" aria-hidden="true">
                    <Icon name={step.icon} size={48} />
                  </div>
                )}
              </div>
            </div>
            <div className="c-onboarding__copy">
              <p className="pica o-type-display o-type--italic c-onboarding__title">
                {step.title}
              </p>
              <p className="brevier c-onboarding__body">{step.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="c-onboarding__nav">
        {/* Dots lead, on their own row — centred, and never squeezed by
            "Create planting scheme"'s width on the last step (that
            crowding was the problem this layout replaces). */}
        <div className="c-onboarding__dots" role="group" aria-label="Steps">
          {SCHEME_ONBOARDING_STEPS.map((step, i) => (
            <button
              key={step.n}
              type="button"
              aria-current={i === activeIndex ? "step" : undefined}
              aria-label={`Go to step ${i + 1}: ${step.title}`}
              onClick={() => goTo(i)}
              className="c-onboarding__dot"
            >
              {/* The button is an invisible, real touch target; this span is
                  the only thing drawn, at the established dot size. */}
              <span
                className={clsx(
                  carouselStyles["o-carousel__position"],
                  i === activeIndex
                    ? carouselStyles["o-carousel__position--current"]
                    : carouselStyles["o-carousel__position--default"]
                )}
              />
            </button>
          ))}
        </div>

        <div className="c-onboarding__actions">
          {activeIndex > 0 ? (
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              className={clsx(
                buttonStyles["o-button"],
                buttonStyles["o-button--ghost"],
                buttonStyles["o-button--flush-start"],
                "c-onboarding__back"
              )}
            >
              <Icon name="back" size={16} />
              Back
            </button>
          ) : (
            <span className="c-onboarding__back" aria-hidden="true" />
          )}

          <button
            type="button"
            onClick={next}
            className={clsx(
              buttonStyles["o-button"],
              buttonStyles["o-button--primary"],
              "c-onboarding__next"
            )}
          >
            {isLast ? "Create planting scheme" : "Next"}
            <Icon name="arrowRight" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
