"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { WelcomeDialog } from "./WelcomeDialog";
import { Upload } from "./Upload";
import { ModeToggle } from "./ModeToggle";

interface ClientGalleryWrapperProps {
  children: React.ReactNode;
}

export function ClientGalleryWrapper({ children }: ClientGalleryWrapperProps) {
  const [guestName, setGuestName] = useState<string>("");
  const searchParams = useSearchParams();
  const photoId = searchParams.get("photoId");
  const isModalOpen = !!photoId;

  return (
    <>
      <WelcomeDialog onNameSet={setGuestName} />
      
      <main className="mx-auto max-w-[1960px] px-4 py-4">
        <header className="flex justify-between items-start gap-4 mb-8">
          <div className="flex flex-col gap-1 flex-1">
            <h1 className="text-2xl sm:text-3xl font-serif font-light text-foreground leading-tight">
              <span className="text-primary font-medium">{process.env.NEXT_PUBLIC_GROOM_NAME}</span>
              <span className="text-muted-foreground mx-2 font-light">&</span>
              <span className="text-primary font-medium">{process.env.NEXT_PUBLIC_BRIDE_NAME}</span>
            </h1>
            <p className="text-sm text-muted-foreground font-light">Wedding Memories</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <ModeToggle />
          </div>
        </header>

        {children}
      </main>

      {/* Floating Upload Button - Hidden when modal is open */}
      <div className={`fixed bottom-6 right-6 z-50 transition-opacity duration-200 ${isModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Upload currentGuestName={guestName} />
      </div>
    </>
  );
}