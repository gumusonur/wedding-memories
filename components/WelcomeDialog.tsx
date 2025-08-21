'use client';

import { useState, useEffect } from 'react';
import { appConfig } from '../config';
import { Button } from './ui/button';
import { GuestNameInput } from './GuestNameInput';
import { validateGuestName } from '../utils/validation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useGuestName, useSetGuestName, useHasHydrated } from '../store/useAppStore';

export function WelcomeDialog() {
  const guestName = useGuestName();
  const setGuestName = useSetGuestName();
  const hasHydrated = useHasHydrated();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNameValid, setIsNameValid] = useState(false);

  useEffect(() => {
    // Only show the dialog if the store has hydrated and guest name is not set
    if (hasHydrated && !guestName) {
      setIsDialogOpen(true);
    }
  }, [hasHydrated, guestName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameValid || !name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Name required',
        description: 'Please enter a valid name to continue.',
      });
      return;
    }
    // Use validated and sanitized name
    try {
      const sanitizedName = validateGuestName(name);
      setGuestName(sanitizedName);
      setIsDialogOpen(false); // Close dialog on successful submission
      toast({
        title: 'Welcome!',
        description: `Nice to meet you, ${sanitizedName}! You can now upload and view photos.`,
      });
    } catch (error) {
      // This shouldn't happen if validation is working correctly in GuestNameInput
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: error instanceof Error ? error.message : 'Please check your name.',
      });
    }
  };

  const handleValidationChange = (isValid: boolean, error: string | null) => {
    setIsNameValid(isValid);
  };

  if (!isDialogOpen) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent
        className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-3">
          <DialogTitle className="text-xl font-serif font-light">
            Welcome to our Wedding Gallery!
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            Hi! You&apos;re viewing{' '}
            <span className="font-medium text-primary">
              {appConfig.brideName}
            </span>{' '}
            &{' '}
            <span className="font-medium text-primary">
              {appConfig.groomName}
            </span>
            &apos;s wedding memories. Please share your name so we can credit any photos you add.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <GuestNameInput
            value={name}
            onChange={setName}
            onValidationChange={handleValidationChange}
            placeholder="Your name"
            className="text-center text-lg h-12 bg-muted/50 border-muted"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (isNameValid) {
                  handleSubmit(e);
                }
              }
            }}
          />

          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full h-11 text-base"
              disabled={!isNameValid}
            >
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
