function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden border border-sand-line bg-paper">
      <div className="aspect-[4/3] w-full bg-sand animate-pulse" />
      <div className="flex flex-col gap-1.5 p-4">
        <div className="h-4 w-3/4 rounded bg-sand animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-sand animate-pulse" />
        <div className="mt-1 h-5 w-16 rounded-full bg-sand animate-pulse" />
      </div>
    </div>
  );
}

export default function PlantsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-medium text-2xl">My plants</h1>
        <div className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium font-sans bg-moss text-white opacity-40 pointer-events-none select-none">
          + Add plant
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
