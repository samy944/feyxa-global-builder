export function MarketProductSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden animate-pulse" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="aspect-square" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="p-3.5 space-y-2.5">
            <div className="h-3.5 rounded-md w-3/4" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-2.5 rounded-md w-1/2" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="h-4 rounded-md w-2/5" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MarketStoreSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-5 rounded-xl animate-pulse"
          style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
        >
          <div className="h-14 w-14 rounded-xl shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 rounded-md w-2/3" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-2.5 rounded-md w-1/2" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
