import type { Metadata } from "next";
import LocationOnboardingSection from "@/components/dashboard/LocationOnboardingSection";
import GardenSection from "@/components/dashboard/GardenSection";
import BirdsSection from "@/components/dashboard/BirdsSection";
import WeatherSection from "@/components/dashboard/WeatherSection";
import SchemesSection from "@/components/dashboard/SchemesSection";
import ShoppingListSection from "@/components/dashboard/ShoppingListSection";

export const metadata: Metadata = {
  title: "Dashboard | Plotted",
};

const SECTIONS = [
  LocationOnboardingSection,
  GardenSection,
  BirdsSection,
  WeatherSection,
  SchemesSection,
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
