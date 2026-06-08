import { effect, Injectable, inject, signal } from '@angular/core';
import { AppService } from '../../services/core/app/app.service';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly appService = inject(AppService);
  private readonly defaultLocale = 'en';
  private fallbackTranslations: Record<string, string> = {};
  private initialized = false;
  private translations: Record<string, string> = {};

  readonly version = signal(0);

  constructor() {
    effect(() => {
      const language = this.appService.configData().appSettings.language_allowed;
      if (this.initialized) {
        void this.setLocale(language);
      }
    });
  }

  async initialize(): Promise<void> {
    this.fallbackTranslations = await this.loadLocale(this.defaultLocale);
    this.initialized = true;
    await this.setLocale(this.appService.configData().appSettings.language_allowed);
  }

  async setLocale(locale: string): Promise<void> {
    const language = (locale || this.defaultLocale).trim().toLowerCase();
    this.translations = language === this.defaultLocale
      ? this.fallbackTranslations
      : await this.loadLocale(language);

    document.documentElement.lang = language;
    document.documentElement.dir = this.isRtl(language) ? 'rtl' : 'ltr';
    this.version.update(value => value + 1);
  }

  translate(key: string | null | undefined): string {
    const normalizedKey = (key || '').replace(/\s+/g, ' ').trim();
    if (!normalizedKey) {
      return '';
    }
    const spaceKey = normalizedKey.replace(/-/g, ' ');
    return this.translations[normalizedKey]
      ?? this.translations[spaceKey]
      ?? this.fallbackTranslations[normalizedKey]
      ?? this.fallbackTranslations[spaceKey]
      ?? normalizedKey;
  }

  private async loadLocale(locale: string): Promise<Record<string, string>> {
    try {
      const response = await fetch(`/assets/translate/${locale}.json`);
      if (!response.ok) {
        return {};
      }
      return await response.json() as Record<string, string>;
    }
    catch {
      return {};
    }
  }

  private isRtl(locale: string): boolean {
    return ['ar'].includes(locale);
  }
}
