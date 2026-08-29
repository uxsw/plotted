// Skeleton card matching Card's shell structure. Used for loading states.
// `pulse` adds the opacity breathe for genuine in-flight loading; leave it off
// for the static ghost cards behind an empty state.
function PlaceholderPlantCard({
  opacity = 1,
  pulse = false,
}: {
  opacity?: number;
  pulse?: boolean;
}) {
  return (
    <div
      className={pulse ? "o-card o-pulse" : "o-card"}
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
