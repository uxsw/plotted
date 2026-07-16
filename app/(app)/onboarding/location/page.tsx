import type { Metadata } from "next";
import { OnboardingLocationStep } from "@/components/onboarding/OnboardingLocationStep";

export const metadata: Metadata = {
  title: "Your garden location | Plotted",
};

export default function OnboardingLocationPage() {
  return <OnboardingLocationStep />;
}
