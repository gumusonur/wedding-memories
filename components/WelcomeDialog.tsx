"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useGuestName, useSetGuestName } from "../store/useAppStore";

interface WelcomeDialogProps {
  onNameSet: (name: string) => void;
}

export function WelcomeDialog({ onNameSet }: WelcomeDialogProps) {
  // Zustand store hooks
  const guestName = useGuestName();
  const setGuestName = useSetGuestName();

  // Local state
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);

    // Check if user has already provided their name (from Zustand store)
    if (!guestName) {
      // Small delay to ensure the app has loaded
      setTimeout(() => setIsOpen(true), 1000);
    } else {
      onNameSet(guestName);
    }
  }, [guestName, onNameSet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter your name to continue.",
      });
      return;
    }

    const trimmedName = name.trim();
    setGuestName(trimmedName);
    onNameSet(trimmedName);
    setIsOpen(false);

    toast({
      title: "Welcome!",
      description: `Nice to meet you, ${name.trim()}! You can now upload and view photos.`,
    });
  };

  // Don't render on server
  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-3">
          <DialogTitle className="text-2xl font-serif font-light">
            Welcome to our Wedding Gallery!
            <span className="text-primary">✨</span>
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            Hello! You&apos;re viewing{" "}
            <span className="font-medium text-primary">
              {process.env.NEXT_PUBLIC_GROOM_NAME || "Groom"}
            </span>{" "}
            &{" "}
            <span className="font-medium text-primary">
              {process.env.NEXT_PUBLIC_BRIDE_NAME || "Bride"}
            </span>
            &apos;s wedding memories.
            <br className="hidden sm:block" />
            Please share your name so we can credit any photos you add.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-center text-lg h-12 bg-muted/50 border-muted"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full h-11 text-base">
              View Wedding Gallery
            </Button>
          </DialogFooter>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          We&apos;ll remember your name for future visits
        </p>
      </DialogContent>
    </Dialog>
  );
}
