import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Add Plant | Plotted",
};
import PlantForm from "@/components/PlantForm";

export default function NewPlantPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link href="/plants" className="text-sm text-ink-soft hover:underline">← My Plants</Link>
        <h1 className="font-display font-medium text-[30px] mt-2">Add a plant</h1>
      </div>
      <PlantForm />
    </div>
  );
}
