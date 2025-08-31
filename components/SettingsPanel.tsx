'use client';

import { Settings, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useI18n } from './I18nProvider';
import { appConfig, Language } from '../config';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languageNames = {
  [Language.English]: 'English',
  [Language.Turkish]: 'Türkçe',
};

const languageFlags = {
  [Language.English]: '🇺🇸',
  [Language.Turkish]: '🇹🇷',
};

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, isLoading } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 px-0 rounded hover:bg-muted/50 transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Language</div>
        {!isLoading &&
          appConfig.supportedLanguages.map((lang) => (
            <DropdownMenuItem key={lang} onClick={() => setLanguage(lang)} className="gap-2">
              <span className="text-base">{languageFlags[lang]}</span>
              <span>{languageNames[lang]}</span>
              {language === lang && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          ))}

        <DropdownMenuSeparator />

        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Theme</div>
        <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
          <Sun className="h-4 w-4" />
          Light
          {theme === 'light' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
          <Moon className="h-4 w-4" />
          Dark
          {theme === 'dark' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
          <Monitor className="h-4 w-4" />
          System
          {theme === 'system' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="px-2 py-2 text-center space-y-1">
          <a
            href="https://www.onurgumus.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            onurgumus.com
          </a>
          <a
            href="https://github.com/gumusonur/wedding-memories"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-foreground hover:text-primary transition-colors duration-200"
          >
            View on GitHub
          </a>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

