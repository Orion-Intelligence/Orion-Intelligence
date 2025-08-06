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
      advance_setting_toggle: this.getFromStorage<boolean>('advance_setting_toggle'),
      iocExpanded: this.getFromStorage<boolean>('iocExpanded') || true,
      entityFilterCondition: this.getFromStorage<boolean>('entityFilterCondition'),
      entityfilterCategories: this.getFromStorage('entityfilterCategories', true) || {},
    };
  }

  getStaticConfig(baseAppSettings: AppSettingsModel): ConfigSettings {
    const localSettings = this.getLocalSettings();
    const app: Partial<AppSettingsModel> = {
      api_allowed: baseAppSettings.api_allowed,
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
}
