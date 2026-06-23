import Link from "next/link";
import PlantForm from "@/components/PlantForm";

export default function NewPlantPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link href="/plants" className="text-sm text-gray-500 hover:underline">← My Plants</Link>
        <h1 className="font-display font-medium text-[30px] text-ink mt-2">Add a plant</h1>
      </div>
      <PlantForm />
    </div>
  );
}
