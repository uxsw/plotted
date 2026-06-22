import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import DeletePlantButton from "@/components/DeletePlantButton";
import { ScientificName, plantDisplayTitle } from "@/lib/plantName";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function datePlanted(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function floweringRange(from: number | null, to: number | null) {
  if (!from && !to) return null;
  if (from && to) return `${MONTHS[from - 1]} – ${MONTHS[to - 1]}`;
  return MONTHS[(from ?? to)! - 1];
}

export default async function PlantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: plant } = await supabase.from("plants").select("*").eq("id", id).single();

  if (!plant) notFound();

  const title = plantDisplayTitle(plant);
  const hasScientific = !!(plant.species || plant.cultivar);

  const fields: { label: string; value: string | null | undefined }[] = [
    { label: "Date planted", value: datePlanted(plant.date_planted) },
    { label: "Sun needs", value: plant.sun_needs },
    { label: "Flowering season", value: floweringRange(plant.flowering_season_from, plant.flowering_season_to) },
    { label: "Height (mature)", value: plant.eventual_height_cm ? `${plant.eventual_height_cm} cm` : null },
    { label: "Spread (mature)", value: plant.eventual_spread_cm ? `${plant.eventual_spread_cm} cm` : null },
    { label: "Purchased from", value: plant.purchased_from },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <Link href="/plants" className="text-sm text-gray-500 hover:underline">← My Plants</Link>
        <div className="flex gap-3">
          <Link
            href="/plants/new"
            className="inline-flex items-center rounded border border-moss px-3 py-1.5 text-sm font-medium font-sans text-moss hover:bg-moss-tint transition-colors"
          >
            Add another
          </Link>
          <Link
            href={`/plants/${plant.id}/edit`}
            className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-50"
          >
            Edit
          </Link>
          <DeletePlantButton id={plant.id} name={title} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {plant.photo_url && (
          <div className="relative w-full h-64">
            <Image
              src={plant.photo_url}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {plant.common_name || (
                hasScientific
                  ? <ScientificName species={plant.species} cultivar={plant.cultivar} />
                  : "Unnamed plant"
              )}
            </h1>
            {plant.common_name && hasScientific && (
              <p className="text-sm text-gray-500 mt-0.5">
                <ScientificName species={plant.species} cultivar={plant.cultivar} />
              </p>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {fields.map(({ label, value }) =>
              value ? (
                <div key={label}>
                  <dt className="text-gray-500 font-medium">{label}</dt>
                  <dd className="text-gray-900 mt-0.5">{value}</dd>
                </div>
              ) : null
            )}
          </dl>

          {plant.notes && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{plant.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
