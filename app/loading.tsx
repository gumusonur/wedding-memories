import { Upload } from "../components/Upload";
import { Skeleton } from "../components/ui/skeleton";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-auto">
      <main className="mx-auto max-w-[1960px] px-4 py-2">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground order-1 sm:order-none">
          {process.env.NEXT_PUBLIC_GROOM_NAME} & {process.env.NEXT_PUBLIC_BRIDE_NAME} Wedding Memories
        </h1>
        <div className="flex items-center gap-2 order-2 sm:order-none">
          <Upload />
        </div>
      </header>

      <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
        {/* Generate skeleton placeholders with realistic image proportions */}
        {Array.from({ length: 16 }).map((_, i) => {
          // Create varied heights to mimic real photo gallery masonry layout
          const aspectRatios = [
            { w: 720, h: 480 },  // 3:2 landscape
            { w: 720, h: 540 },  // 4:3
            { w: 720, h: 900 },  // 4:5 portrait
            { w: 720, h: 720 },  // 1:1 square
            { w: 720, h: 960 },  // 3:4 portrait
            { w: 720, h: 405 },  // 16:9 landscape
            { w: 720, h: 600 },  // 6:5
            { w: 720, h: 800 },  // portrait
          ];
          
          const ratio = aspectRatios[i % aspectRatios.length];
          const height = Math.round((ratio.h / ratio.w) * 300); // Scale to reasonable size
          
          return (
            <div 
              key={i} 
              className="relative mb-5 block w-full overflow-hidden group"
            >
              <Skeleton 
                className="w-full rounded-lg transition-all duration-200 hover:brightness-110" 
                style={{ height: `${height}px` }} 
              />
              {/* Simulate the shadow highlight effect */}
              <div className="absolute inset-0 rounded-lg shadow-highlight pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          );
        })}
      </div>
    </main>
    </div>
  );
}