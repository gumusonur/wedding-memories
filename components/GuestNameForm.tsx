'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSetGuestName } from '../store/useAppStore';
import { GuestNameInput } from './GuestNameInput';
import { Button } from './ui/button';
import { validateGuestName } from '../utils/validation';
import { useI18n } from './I18nProvider';
import { appConfig } from '../config';

export function GuestNameForm() {
  const { t } = useI18n();
  const { toast } = useToast();
  const setGuestName = useSetGuestName();
  const [name, setName] = useState('');
  const [isNameValid, setIsNameValid] = useState(false);

  const handleValidationChange = (isValid: boolean, _error: string | null) => {
    setIsNameValid(isValid);
  };

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

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-light text-foreground leading-tight mb-2">
            <span className="text-primary font-medium">{appConfig.brideName}</span>
            <span className="text-muted-foreground mx-2 font-light">&</span>
            <span className="text-primary font-medium">{appConfig.groomName}</span>
          </h1>
          <p className="text-muted-foreground">{t('gallery.weddingMemories')}</p>
        </div>
        
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">{t('gallery.welcome', { 
            brideName: appConfig.brideName, 
            groomName: appConfig.groomName 
          })}</h2>
          <p className="text-muted-foreground mb-6">
            {t('gallery.enterNamePrompt', { 
              brideName: appConfig.brideName, 
              groomName: appConfig.groomName 
            })}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <GuestNameInput
              value={name}
              onChange={setName}
              onValidationChange={handleValidationChange}
              placeholder={t('welcome.placeholder')}
              className="text-center text-lg h-12"
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
            
            <Button 
              type="submit" 
              className="w-full h-11 text-base"
              disabled={!isNameValid}
            >
              {t('gallery.enterGallery')}
            </Button>
          </form>
        </div>
        
        <p className="text-xs text-muted-foreground">
          {t('welcome.rememberName')}
        </p>
      </div>
    </div>
  );
}