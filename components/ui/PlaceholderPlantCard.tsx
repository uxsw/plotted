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
        <div className={cardStyles["o-card__text-skeleton-lead"]} />
        <div className={cardStyles["o-card__text-skeleton-secondary"]} />
      </div>
    </div>
  );
}

export { PlaceholderPlantCard };
