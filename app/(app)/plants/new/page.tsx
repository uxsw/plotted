import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";

export const metadata: Metadata = {
  title: "Add Plant | Plotted",
};
import PlantForm from "@/components/PlantForm";

export default function NewPlantPage() {
  return (
    <div>
      <div>
        <Link
          href="/plants"
          className={clsx(
            buttonStyles["o-button"],
            buttonStyles["o-button--ghost"],
            buttonStyles["o-button--flush-start"]
          )}
        >← My Plants</Link>
        <h1 className="pica">Add a plant</h1>
      </div>
      <PlantForm />
    </div>
  );
}
