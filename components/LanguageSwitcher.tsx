'use client';

import React from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Languages, Globe } from 'lucide-react';
import { useI18n } from './I18nProvider';
import { appConfig, Language } from '../config';

interface LanguageSwitcherProps {
  variant?: 'default' | 'minimal';
  className?: string;
}

const languageNames = {
  [Language.English]: 'English',
  [Language.Turkish]: 'Türkçe',
};

const languageFlags = {
  [Language.English]: '🇺🇸',
  [Language.Turkish]: '🇹🇷',
};

export function LanguageSwitcher({ variant = 'default', className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage, isLoading } = useI18n();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Globe className="h-4 w-4" />
      </Button>
    );
  }

  if (variant === 'minimal') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={`${className} flex items-center gap-2`}>
            <span className="text-base">{languageFlags[language]}</span>
            <span className="text-xs font-medium">{languageNames[language]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[140px]">
          {appConfig.supportedLanguages.map((lang) => (
            <DropdownMenuItem
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`flex items-center gap-3 cursor-pointer ${
                language === lang ? 'bg-muted/50 font-medium' : ''
              }`}
            >
              <span className="text-base">{languageFlags[lang]}</span>
              <span>{languageNames[lang]}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={`${className} flex items-center gap-2`}>
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{languageNames[language]}</span>
          <span className="sm:hidden">{languageFlags[language]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {appConfig.supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`flex items-center gap-3 cursor-pointer ${
              language === lang ? 'bg-muted/50 font-medium' : ''
            }`}
          >
            <span className="text-base">{languageFlags[lang]}</span>
            <span>{languageNames[lang]}</span>
            {language === lang && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}