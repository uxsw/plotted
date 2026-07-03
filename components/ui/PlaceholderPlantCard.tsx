// Ghost card matching Card's shape/dimensions with muted grey blocks standing in
// for photo/name/detail text. Reusable later for loading/skeleton states.
function PlaceholderPlantCard({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      className="flex flex-col rounded-lg overflow-hidden border border-sand-line bg-paper"
      style={{ opacity }}
      aria-hidden="true"
    >
      <div className="aspect-[4/3] w-full bg-paper-deep" />
      <div className="flex flex-col gap-1.5 p-4 flex-1">
        <div className="h-4 w-3/4 rounded bg-sand-line" />
        <div className="h-3 w-1/2 rounded bg-sand-line" />
      </div>
    </div>
  );
}

export { PlaceholderPlantCard };
