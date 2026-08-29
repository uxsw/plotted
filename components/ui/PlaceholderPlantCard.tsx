// Skeleton card matching Card's shell structure. Used for loading states.
function PlaceholderPlantCard({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      className="o-card"
      style={{ opacity }}
      aria-hidden="true"
    >
      <div className="o-card__media" />
      <div className="o-card__body">
        <div className="o-card__text-skeleton-lead" />
        <div className="o-card__text-skeleton-secondary" />
      </div>
    </div>
  );
}

export { PlaceholderPlantCard };
