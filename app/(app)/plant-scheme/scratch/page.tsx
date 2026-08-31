import type { Metadata } from "next";
import FreeTextPlantEntry from "../_components/FreeTextPlantEntry";

export const metadata: Metadata = {
  title: "Enter plants | Plotted",
};

export default function PlantSchemeScratchPage() {
  return <FreeTextPlantEntry />;
}
