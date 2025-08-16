import { Skeleton } from "../../../components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-[1960px] p-4">
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="relative aspect-[3/2] max-h-full w-full max-w-7xl">
          {/* Main image skeleton */}
          <Skeleton className="w-full h-full rounded-lg" />
          
          {/* Navigation buttons skeleton */}
          <div className="absolute left-3 top-[calc(50%-16px)]">
            <Skeleton className="w-12 h-12 rounded-full" />
          </div>
          <div className="absolute right-3 top-[calc(50%-16px)]">
            <Skeleton className="w-12 h-12 rounded-full" />
          </div>
          
          {/* Top controls skeleton */}
          <div className="absolute top-0 right-0 flex items-center gap-2 p-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
          
          {/* Close button skeleton */}
          <div className="absolute top-0 left-0 p-3">
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
          
          {/* Bottom thumbnail navigation skeleton */}
          <div className="fixed inset-x-0 bottom-0 z-40">
            <div className="mx-auto mt-6 mb-6 flex aspect-[3/2] h-14 gap-1 px-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-full rounded-sm flex-shrink-0" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}