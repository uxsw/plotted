export default function PlantsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded bg-sand-line animate-pulse" />
        <div className="h-9 w-24 rounded bg-sand-line animate-pulse" />
      </div>

      {/* Skeleton grid */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-lg overflow-hidden border border-sand-line bg-paper"
          >
            <div className="aspect-[4/3] w-full bg-sand-line animate-pulse" />
            <div className="flex flex-col gap-2 p-4">
              <div className="h-4 w-3/4 rounded bg-sand-line animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-sand-line animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
