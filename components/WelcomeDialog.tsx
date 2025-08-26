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
import { useI18n } from './I18nProvider';

export function WelcomeDialog() {
  const guestName = useGuestName();
  const setGuestName = useSetGuestName();
  const hasHydrated = useHasHydrated();
  const { toast } = useToast();
  const { t } = useI18n();

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
        title: t('errors.nameRequired'),
        description: t('errors.nameRequiredDescription'),
      });
      return;
    }
    // Use validated and sanitized name
    try {
      const sanitizedName = validateGuestName(name, t);
      setGuestName(sanitizedName);
      setIsDialogOpen(false); // Close dialog on successful submission
      toast({
        title: t('success.welcome'),
        description: t('success.welcomeDescription', { name: sanitizedName }),
      });
    } catch (error) {
      // This shouldn't happen if validation is working correctly in GuestNameInput
      toast({
        variant: 'destructive',
        title: t('errors.validationError'),
        description: error instanceof Error ? error.message : t('errors.validationErrorDescription'),
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
            {t('welcome.title')}
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            {t('welcome.description', {
              brideName: appConfig.brideName,
              groomName: appConfig.groomName,
              interpolation: { escapeValue: false }
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <GuestNameInput
            value={name}
            onChange={setName}
            onValidationChange={handleValidationChange}
            placeholder={t('welcome.placeholder')}
            className="text-center text-lg h-12 bg-muted/50 border-muted"
            autoFocus
            t={t}
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
              {t('welcome.button')}
            </Button>
          </DialogFooter>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          {t('welcome.rememberName')}
        </p>
      </DialogContent>
    </Dialog>
  );
}
