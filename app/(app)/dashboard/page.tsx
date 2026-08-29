import type { CSSProperties } from "react";
import type { Metadata } from "next";
import DashboardDateline from "@/components/dashboard/DashboardDateline";
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
      <div className="c-dashboard__block" style={{ "--dash-i": 0 } as CSSProperties}>
        <DashboardDateline />
      </div>
      {SECTIONS.map((Section, i) => (
        // A conditional section can render nothing — :empty on the block keeps
        // it out of the flex flow so no phantom gap opens up.
        <div
          key={i}
          className="c-dashboard__block"
          style={{ "--dash-i": i + 1 } as CSSProperties}
        >
          <Section />
        </div>
      ))}
    </div>
  );
}
