import { Injectable, signal, effect } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { AppConfigData, AppSettings, ConfigData, ConfigSettings, LocalSettingsInput } from '../../shared/model/app/config';
import { ActivatedRoute, Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class AppService {
  public configData = signal<ConfigData>(new ConfigData());
  public page = signal<number>(1);
  private watchList: (keyof ConfigSettings)[] = ['enable_advanced_tools',
    'advance_setting_toggle',
    'iocExpanded',
    'entityFilterCondition',
    'sidebarFilters',
    'entityfilterCategories',
    'selectedEntityCategoryId'];

  constructor(
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    this.activatedRoute.queryParams.subscribe(params => {
      const pageParam = params['page'];
      if (pageParam && !isNaN(+pageParam)) {
        this.updatePage(+pageParam);
      }
    });

    this.loadStaticConfig()
    this.watchConfigSettings();
  }

  loadConfig(): void {
    this.apiService.get<ConfigData>('public').subscribe(response => {
      if (response && response.settings) {
        const currentLocalSettings = this.configData().settings;
        this.configData.set(new AppConfigData(response, {
          advance_setting_toggle: currentLocalSettings.advance_setting_toggle,
          iocExpanded: currentLocalSettings.iocExpanded,
          entityFilterCondition: currentLocalSettings.entityFilterCondition,
          sidebarFilters: currentLocalSettings.sidebarFilters,
          entityfilterCategories: currentLocalSettings.entityfilterCategories,
          selectedEntityCategoryId: currentLocalSettings.selectedEntityCategoryId
        }));
      }
    });
  }

  loadStaticConfig(): void {
    const localData: LocalSettingsInput = {};
    const storedAdvancedTools = localStorage.getItem('enable_advanced_tools');
    const storedAdvancedToggle = localStorage.getItem('advance_setting_toggle');
    const storedIocExpanded = localStorage.getItem('iocExpanded');
    const storedEntityFilterCondition = localStorage.getItem('entityFilterCondition');
    const storedSidebarFilters = localStorage.getItem('sidebarFilters');
    const storedEntityfilterCategories = localStorage.getItem('entityfilterCategories');
    const storedSelectedEntityCategoryId = localStorage.getItem('selectedEntityCategoryId');

    if (storedAdvancedToggle) {
      localData.advance_setting_toggle = storedAdvancedToggle === 'true';
    }
    if (storedIocExpanded) {
      localData.iocExpanded = storedIocExpanded === 'true';
    }
    if (storedEntityFilterCondition) {
      localData.entityFilterCondition = storedEntityFilterCondition === 'true';
    }
    if (storedSidebarFilters) {
      localData.sidebarFilters = JSON.parse(storedSidebarFilters);

    }
    if (storedEntityfilterCategories) {
      localData.entityfilterCategories = JSON.parse(storedEntityfilterCategories);
    }
    if (storedSelectedEntityCategoryId) {
      localData.selectedEntityCategoryId = storedSelectedEntityCategoryId;
    }

    const currentConfig = this.configData();
    this.configData.set(new AppConfigData({
      settings: {
        api_allowed: currentConfig.settings.api_allowed,
        telegram_allowed: currentConfig.settings.telegram_allowed,
        version: currentConfig.settings.version,
        language_allowed: currentConfig.settings.language_allowed,
        logo_url: currentConfig.settings.logo_url,
        enable_advanced_tools: storedAdvancedTools === 'true',
      }
    }, localData));
  }

  getConfig(): ConfigSettings {
    return this.configData().settings;
  }

  get<T extends keyof AppSettings>(key: T, defaultValue: AppSettings[T]): AppSettings[T] {
    const settings = this.configData().settings;
    return settings[key] !== undefined ? settings[key]! : defaultValue;
  }


  set<T extends keyof AppSettings>(key: T, value: AppSettings[T]): void {
    this.configData.update(current => {
      const updatedSettings = { ...current.settings, [key]: value };
      return new AppConfigData({
        settings: updatedSettings
      }, updatedSettings);
    });
  }

  updatePage(newPage: number): void {
    this.page.set(newPage);
    const currentParams = { ...this.activatedRoute.snapshot.queryParams };
    currentParams['page'] = newPage;
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: currentParams,
      replaceUrl: true
    }).then();
  }

  watchConfigSettings(): void {
    let prevValues: Partial<Record<keyof ConfigSettings, any>> = {};
    this.watchList.forEach(key => {
      prevValues[key] = this.configData().settings[key];
    });
    effect(() => {
      const currentSettings = this.configData().settings;
      this.watchList.forEach(key => {
        const newValue = currentSettings[key];
        if (newValue !== undefined) {
          if (typeof newValue === 'boolean') {
            localStorage.setItem(key, newValue ? 'true' : 'false');
          } else if (typeof newValue === 'object') {
            localStorage.setItem(key, JSON.stringify(newValue));
          } else {
            localStorage.setItem(key, String(newValue));
          }
        }
      });
    });
  }
}
