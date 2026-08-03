import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Add Plant | Plotted",
};
import PlantForm from "@/components/PlantForm";

export default function NewPlantPage() {
  return (
    <div className="o-stack">
      <div className="o-stack">
        <Link
          href="/plants"
          className={clsx(
            buttonStyles["o-button"],
            buttonStyles["o-button--ghost"],
            buttonStyles["o-button--flush-start"]
          )}
        >
          <Icon name="back" aria-label="back" />
          My Plants</Link>
        <h1 className="pica o-type-display o-type-weight--bold">Add a plant</h1>
      </div>
      <PlantForm />
    </div>
  );
}
