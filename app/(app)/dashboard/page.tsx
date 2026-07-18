import type { Metadata } from "next";
import GardenSection from "@/components/dashboard/GardenSection";
import BirdsSection from "@/components/dashboard/BirdsSection";
import WeatherSection from "@/components/dashboard/WeatherSection";
import SchemesSection from "@/components/dashboard/SchemesSection";
import ShoppingListSection from "@/components/dashboard/ShoppingListSection";

export const metadata: Metadata = {
  title: "Dashboard | Plotted",
};

const SECTIONS = [
  GardenSection,
  BirdsSection,
  WeatherSection,
  SchemesSection,
  ShoppingListSection,
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      {SECTIONS.map((Section, i) => (
        <Section key={i} />
      ))}
    </div>
  );
}
