import cardStyles from "./Card.module.css";

// Skeleton card matching Card's shell structure. Used for loading states.
function PlaceholderPlantCard({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      className={cardStyles["o-card"]}
      style={{ opacity }}
      aria-hidden="true"
    >
      <div className={cardStyles["o-card__image"]} />
      <div className={cardStyles["o-card__body"]}>
        <div className="h-4 w-3/4 rounded bg-sand-line" />
        <div className="h-3 w-1/2 rounded bg-sand-line" />
      </div>
    </div>
  );
}

export { PlaceholderPlantCard };
