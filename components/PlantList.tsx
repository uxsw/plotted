"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Plant } from "@/lib/types";
import { ScientificName } from "@/lib/plantName";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function floweringRange(from: number | null, to: number | null) {
  if (!from && !to) return null;
  if (from && to) return `${MONTHS[from - 1]}–${MONTHS[to - 1]}`;
  return MONTHS[(from ?? to)! - 1];
}

function datePlanted(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default function PlantList({ plants }: { plants: Plant[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size > 0 && prev.size === plants.length ? new Set() : new Set(plants.map((p) => p.id))
    );
  }

  if (plants.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-4xl mb-3">🌱</p>
        <p className="text-sm">No plants yet. Add your first one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {selected.size > 0 && (
        <div className="bg-green-50 border border-green-200 rounded px-4 py-2 text-sm text-green-800 flex items-center justify-between">
          <span>{selected.size} plant{selected.size > 1 ? "s" : ""} selected</span>
          <button
            onClick={() => setSelected(new Set())}
            className="text-green-600 hover:underline text-xs"
          >
            Clear
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={plants.length > 0 && selected.size === plants.length}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Plant</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Planted</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Flowering</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plants.map((plant) => {
              const title = plant.common_names?.[0] ?? null;
              const hasScientific = !!(plant.species || plant.cultivar);
              return (
                <tr key={plant.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(plant.id)}
                      onChange={() => toggleOne(plant.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {plant.photo_url ? (
                        <Image
                          src={plant.photo_url}
                          alt={plant.common_names?.[0] || plant.species || "plant"}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded bg-green-100 flex items-center justify-center flex-shrink-0 text-lg">🌿</div>
                      )}
                      <div>
                        <Link
                          href={`/plants/${plant.id}`}
                          className="font-medium text-gray-900 hover:text-green-700 hover:underline"
                        >
                          {title ?? (
                            hasScientific
                              ? <ScientificName genus={plant.genus} species={plant.species} cultivar={plant.cultivar} />
                              : "Unnamed plant"
                          )}
                        </Link>
                        {title && hasScientific && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            <ScientificName species={plant.species} cultivar={plant.cultivar} />
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{datePlanted(plant.date_planted) ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {floweringRange(plant.flowering_season_from, plant.flowering_season_to) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/plants/${plant.id}/edit`}
                      className="text-xs text-gray-400 hover:text-green-700 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
