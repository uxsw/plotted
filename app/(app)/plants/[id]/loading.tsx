export default function PlantDetailLoading() {
  return (
    <div className="c-plant-detail-skeleton">
      {/* Photo zone */}
      <div className="is-photo o-pulse" />

      {/* Content */}
      <div className="o-stack island">
        {/* Title + subtitle */}
        <div>
          <div className="h-7 w-48 bg-sand-line rounded animate-pulse" />
          <div className="h-4 w-32 bg-sand-line rounded animate-pulse mt-1" />
        </div>

        {/* Field grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-20 bg-sand-line rounded animate-pulse" />
              <div className="h-5 w-32 bg-sand-line rounded animate-pulse mt-1" />
            </div>
          ))}
        </div>

        {/* Notes */}
        <div>
          <div className="h-3 w-16 bg-sand-line rounded animate-pulse" />
          <div className="h-20 w-full bg-sand-line rounded animate-pulse mt-1" />
        </div>
      </div>
    </div>
  );
}
