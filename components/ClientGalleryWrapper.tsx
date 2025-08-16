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
      
      <main className="mx-auto max-w-[1960px] px-4 py-2">
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground order-1 sm:order-none">
            {process.env.NEXT_PUBLIC_GROOM_NAME} & {process.env.NEXT_PUBLIC_BRIDE_NAME} Wedding Memories
          </h1>
          <div className="flex items-center gap-2 order-2 sm:order-none">
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