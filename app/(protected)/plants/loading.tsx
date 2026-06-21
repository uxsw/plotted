export default function PlantsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 rounded bg-sand animate-pulse" />
        <div className="h-9 w-24 rounded bg-sand animate-pulse" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-sand-line overflow-hidden">
            <div className="aspect-[4/3] bg-sand animate-pulse" />
            <div className="p-4 flex flex-col gap-2">
              <div className="h-4 w-3/4 rounded bg-sand animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-sand animate-pulse" />
              <div className="flex gap-1.5 mt-1">
                <div className="h-5 w-14 rounded-full bg-sand animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
