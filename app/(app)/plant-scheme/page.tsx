import type { Metadata } from "next";
import EntryChoice from "./_components/EntryChoice";

export const metadata: Metadata = {
  title: "New Planting Scheme | Plotted",
};

export default function PlantSchemeEntryPage() {
  return <EntryChoice />;
}
