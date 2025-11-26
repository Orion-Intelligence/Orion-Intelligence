import {effect, Injectable, WritableSignal} from '@angular/core';
import {AppSettingsModel, ConfigSettings, LocalSettingsModel} from '../../../shared/model/app/config';

@Injectable({
  providedIn: 'root'
})
export class AppStorageService {
  public readonly watchList: (keyof LocalSettingsModel)[] = [
    'enable_advanced_tools',
    'advance_setting_toggle',
    'iocExpanded',
    'entityFilterCondition',
    'entityfilterCategories',
    'isSidebarOpen',
    'matchType',
    'sortType'
  ];

  getFromStorage<T>(key: string, parseJson = false): T | undefined {
    const value = localStorage.getItem(key);
    if (value === null) return undefined;
    if (parseJson) return JSON.parse(value);
    if (value === 'true') return true as T;
    if (value === 'false') return false as T;
    return value as unknown as T;
  }

  getLocalSettings(): Partial<LocalSettingsModel> {
    return {
      enable_advanced_tools: this.getFromStorage<boolean>('enable_advanced_tools'),
      advance_setting_toggle: this.getFromStorage<boolean>('advance_setting_toggle') || true,
      iocExpanded: this.getFromStorage<boolean>('iocExpanded') || true,
      entityFilterCondition: this.getFromStorage<boolean>('entityFilterCondition'),
      entityfilterCategories: this.getFromStorage('entityfilterCategories', true) || {},
      isSidebarOpen: this.getFromStorage('isSidebarOpen', true),
      matchType: this.getFromStorage<string>('matchType') || 'or',
      sortType: this.getFromStorage<string>('sortType'),
    };
  }

  getStaticConfig(baseAppSettings: AppSettingsModel): ConfigSettings {
    const localSettings = this.getLocalSettings();
    const app: Partial<AppSettingsModel> = {
      telegram_allowed: baseAppSettings.telegram_allowed,
      version: baseAppSettings.version,
      language_allowed: baseAppSettings.language_allowed,
      logo_url: baseAppSettings.logo_url
    };
    return new ConfigSettings(app, localSettings);
  }

  setupWatcher(configData: WritableSignal<ConfigSettings>): void {
    effect(() => {
      const settings = configData().localSettings;
      this.watchList.forEach(key => {
        const value = settings[key];
        if (value !== undefined) {
          const storeValue =
            typeof value === 'boolean' ? String(value)
              : typeof value === 'object' ? JSON.stringify(value)
                : String(value);

          localStorage.setItem(key, storeValue);
        }
      });
    });
  }

  getTheme(): 'dark-theme' | 'light-theme' | undefined {
    const v = localStorage.getItem('theme') as 'dark-theme' | 'light-theme' | null;
    return v === 'dark-theme' || v === 'light-theme' ? v : undefined;
  }

  setTheme(theme: 'dark-theme' | 'light-theme'): void {
    localStorage.setItem('theme', theme);
  }

  clearStorage(): void {
    localStorage.clear();
  }
}
