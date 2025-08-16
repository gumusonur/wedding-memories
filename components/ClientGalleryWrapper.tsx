"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { WelcomeDialog, guestNameUtils } from "./WelcomeDialog";
import { Upload } from "./Upload";
import { ModeToggle } from "./ModeToggle";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ClientGalleryWrapperProps {
  children: React.ReactNode;
}

export function ClientGalleryWrapper({ children }: ClientGalleryWrapperProps) {
  const [guestName, setGuestName] = useState<string>("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGuestName, setNewGuestName] = useState("");
  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const photoId = searchParams.get("photoId");
  const isModalOpen = !!photoId;
  const { toast } = useToast();

  // Load guest name from localStorage on mount
  useEffect(() => {
    const storedName = guestNameUtils.get() || "";
    setGuestName(storedName);
    setNewGuestName(storedName);
  }, []);

  // Update guest name when WelcomeDialog sets it
  const handleNameSet = (name: string) => {
    setGuestName(name);
    setNewGuestName(name);
  };

  const handleNameChange = () => {
    const inputValue = nameInputRef.current?.value || "";
    
    if (!inputValue.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter a valid name.",
      });
      return;
    }

    const trimmedName = inputValue.trim();
    
    setGuestName(trimmedName);
    guestNameUtils.set(trimmedName);
    setIsEditingName(false);
    
    toast({
      title: "Name updated",
      description: `Your name has been changed to ${trimmedName}`,
    });
  };

  return (
    <>
      <WelcomeDialog onNameSet={handleNameSet} />
      
      <main className="mx-auto max-w-[1960px] px-4 py-4">
        <header className="flex justify-between items-center gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-serif font-light text-foreground leading-tight truncate">
              <span className="text-primary font-medium">{process.env.NEXT_PUBLIC_GROOM_NAME}</span>
              <span className="text-muted-foreground mx-1 sm:mx-2 font-light">&</span>
              <span className="text-primary font-medium">{process.env.NEXT_PUBLIC_BRIDE_NAME}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-light">Wedding Memories</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {guestName && (
              <div className="flex items-center gap-2 px-3 py-2 border border-muted-foreground/20 rounded text-sm h-8">
                <span className="font-medium text-primary truncate max-w-24 sm:max-w-none">{guestName}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setNewGuestName(guestName);
                    setIsEditingName(true);
                  }}
                  className="h-5 w-5 p-0 hover:bg-primary/20"
                  title="Change name"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            )}
            <ModeToggle />
          </div>
        </header>

        {children}
      </main>

      {/* Floating Upload Button - Hidden when modal is open */}
      <div className={`fixed bottom-6 right-6 z-50 transition-opacity duration-200 ${isModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Upload currentGuestName={guestName} />
      </div>

      {/* Guest Name Edit Dialog */}
      <Dialog open={isEditingName} onOpenChange={setIsEditingName}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Your Name</DialogTitle>
            <DialogDescription>
              Update the name that will be associated with your photos.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleNameChange(); }} className="space-y-4">
            <input
              ref={nameInputRef}
              type="text"
              placeholder="Enter your name"
              defaultValue={guestName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleNameChange();
                }
              }}
              autoFocus
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingName(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleNameChange}>
              Update Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}