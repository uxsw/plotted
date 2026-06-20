import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PlantForm from "@/components/PlantForm";

export default async function EditPlantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: plant } = await supabase.from("plants").select("*").eq("id", id).single();

  if (!plant) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/plants/${plant.id}`} className="text-sm text-gray-500 hover:underline">
          ← {plant.common_name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit plant</h1>
      </div>
      <PlantForm plant={plant} />
    </div>
  );
}
