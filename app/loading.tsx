import { Upload } from '../components/Upload';
import { Skeleton } from '../components/ui/skeleton';
import { appConfig } from '../config';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-auto">
      <main className="mx-auto max-w-[1960px] px-4 py-4">
        <header className="flex justify-between items-start gap-4 mb-8">
          <div className="flex flex-col gap-1 flex-1">
            <h1 className="text-2xl sm:text-3xl font-serif font-light text-foreground leading-tight">
              <span className="text-primary font-medium">{appConfig.brideName}</span>
              <span className="text-muted-foreground mx-2 font-light">&</span>
              <span className="text-primary font-medium">{appConfig.groomName}</span>
            </h1>
            <p className="text-sm text-muted-foreground font-light">Wedding Memories</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Upload />
          </div>
        </header>

        <div className="columns-1 gap-5 sm:columns-2 xl:columns-3 2xl:columns-4">
          {/* Generate skeleton placeholders with realistic image proportions */}
          {Array.from({ length: 16 }).map((_, i) => {
            // Create varied heights to mimic real photo gallery masonry layout
            const aspectRatios = [
              { w: 720, h: 480 }, // 3:2 landscape
              { w: 720, h: 540 }, // 4:3
              { w: 720, h: 900 }, // 4:5 portrait
              { w: 720, h: 720 }, // 1:1 square
              { w: 720, h: 960 }, // 3:4 portrait
              { w: 720, h: 405 }, // 16:9 landscape
              { w: 720, h: 600 }, // 6:5
              { w: 720, h: 800 }, // portrait
            ];

            const ratio = aspectRatios[i % aspectRatios.length];
            const height = Math.round((ratio.h / ratio.w) * 300); // Scale to reasonable size

            return (
              <div key={i} className="relative mb-5 block w-full overflow-hidden group">
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
