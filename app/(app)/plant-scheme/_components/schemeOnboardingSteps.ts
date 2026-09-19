import type { IconName } from "@/components/ui/Icon";

/**
 * The three-step "how a scheme comes together" story, drawn on by
 * OnboardingCarousel.tsx (the one-time welcome dialog) — now the only place
 * it's told. It used to also feed HowItWorks.tsx, the hub's own compact,
 * always-available reference triptych; that was retired once the welcome
 * dialog covered the same ground for the audience that actually needed it.
 *
 * `title`/`body` are placeholder copy — short on purpose, but expect real
 * content (and photoSrc/photoAlt) to replace both once written. `photoSrc`
 * falls back to a season-washed placeholder mark (`icon`) until then; see
 * OnboardingCarousel.tsx's own doc comment for what renders instead.
 */
export interface SchemeOnboardingStep {
  n: string;
  title: string;
  body: string;
  icon: IconName;
  accent: "spring" | "early-summer" | "summer";
  photoSrc?: string;
  photoAlt?: string;
}

export const SCHEME_ONBOARDING_STEPS: SchemeOnboardingStep[] = [
  {
    n: "01",
    title: "Choose a few plants",
    body: "From your garden, or a few you're considering.",
    icon: "sprout",
    accent: "spring",
  },
  {
    n: "02",
    title: "Answer a few quick questions",
    body: "About the spot — skip anything you're not sure of.",
    icon: "message",
    accent: "early-summer",
  },
  {
    n: "03",
    title: "Watch it come together",
    body: "Suggestions arrive with a reason, ready to add.",
    icon: "flower",
    accent: "summer",
  },
];
