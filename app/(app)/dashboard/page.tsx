import type { Metadata } from "next";
import LocationOnboardingSection from "@/components/dashboard/LocationOnboardingSection";
import GardenSection from "@/components/dashboard/GardenSection";
import BirdsSection from "@/components/dashboard/BirdsSection";
import WeatherSection from "@/components/dashboard/WeatherSection";
import ShoppingListSection from "@/components/dashboard/ShoppingListSection";

export const metadata: Metadata = {
  title: "Dashboard | Plotted",
};

// Order per the dashboard shape brief: the user's own garden leads, then the
// time-sensitive check-in blocks. Planting schemes is intentionally not here —
// it lives in the primary nav, not on the home screen.
const SECTIONS = [
  LocationOnboardingSection,
  GardenSection,
  WeatherSection,
  BirdsSection,
  ShoppingListSection,
];

export default function DashboardPage() {
  return (
    <div className="c-dashboard__container">
      {SECTIONS.map((Section, i) => (
        <Section key={i} />
      ))}
    </div>
  );
}
