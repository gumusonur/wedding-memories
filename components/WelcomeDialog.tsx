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

const GUEST_NAME_KEY = "wedding-guest-name";

interface WelcomeDialogProps {
  onNameSet: (name: string) => void;
}

export function WelcomeDialog({ onNameSet }: WelcomeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    
    // Check if user has already provided their name
    const storedName = localStorage.getItem(GUEST_NAME_KEY);
    if (!storedName) {
      // Small delay to ensure the app has loaded
      setTimeout(() => setIsOpen(true), 1000);
    } else {
      onNameSet(storedName);
    }
  }, [onNameSet]);

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

    localStorage.setItem(GUEST_NAME_KEY, name.trim());
    onNameSet(name.trim());
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
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl">Welcome! 🎉</DialogTitle>
          <DialogDescription className="text-base">
            Welcome to {process.env.NEXT_PUBLIC_GROOM_NAME} & {process.env.NEXT_PUBLIC_BRIDE_NAME}'s wedding gallery! 
            <br />
            Please tell us your name so we can credit your photos.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-center text-lg"
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <Button type="submit" className="w-full">
              Continue to Wedding Gallery
            </Button>
          </DialogFooter>
        </form>
        
        <p className="text-xs text-muted-foreground text-center">
          Your name will be saved for future visits
        </p>
      </DialogContent>
    </Dialog>
  );
}

// Utility functions for managing guest name
export const guestNameUtils = {
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(GUEST_NAME_KEY);
  },
  
  set: (name: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(GUEST_NAME_KEY, name);
  },
  
  clear: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(GUEST_NAME_KEY);
  }
};