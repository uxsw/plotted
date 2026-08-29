import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";
import { PlaceholderPlantCard } from "@/components/ui/PlaceholderPlantCard";

export default function PlantsLoading() {
  return (
    <div className="o-stack" aria-busy="true">
      <div className="o-row o-row--space-between">
        <h1 className="pica o-type-display kirk">My plants</h1>
        <span
          className={clsx(buttonStyles["o-button"], buttonStyles["o-button--primary"])}
          style={{ opacity: 0.4, pointerEvents: "none" }}
          aria-hidden="true"
        >
          <Icon name="add" aria-label="none" /> Add plant
        </span>
      </div>

      <div className="o-row">
        <div className="c-plant-search">
          <div
            className="o-text-input c-plant-search__field o-pulse"
            style={{ height: "2.625rem" }}
            aria-hidden="true"
          />
        </div>
        <span
          className={clsx(buttonStyles["o-button"], buttonStyles["o-button--icon"])}
          style={{ pointerEvents: "none" }}
          aria-hidden="true"
        >
          <Icon name="filter" aria-label="none" />
        </span>
      </div>

      <div className="c-plant-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <PlaceholderPlantCard key={i} pulse />
        ))}
      </div>
    </div>
  );
}
