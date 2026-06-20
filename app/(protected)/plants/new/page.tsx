import Link from "next/link";
import PlantForm from "@/components/PlantForm";

export default function NewPlantPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link href="/plants" className="text-sm text-gray-500 hover:underline">← My Plants</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Add plant</h1>
      </div>
      <PlantForm />
    </div>
  );
}
