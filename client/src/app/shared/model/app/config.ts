export class AppSettingsModel {
  ai_endpoint: string = '';
  telegram_allowed: boolean = false;
  version: string = '1.0.0';
  language_allowed: string = 'en';
  logo_url: string = '';

  constructor(data?: Partial<Record<keyof AppSettingsModel, string | boolean>>) {
    if (data) {
      this.ai_endpoint = (data.ai_endpoint as string) || this.ai_endpoint;
      this.telegram_allowed = data.telegram_allowed === '1' || data.telegram_allowed === true;
      this.version = (data.version as string) || this.version;
      this.language_allowed = (data.language_allowed as string) || this.language_allowed;
      this.logo_url = (data.logo_url as string) || this.logo_url;
    }
  }
}

export class LocalSettingsModel {
  enable_advanced_tools: boolean = false;
  advance_setting_toggle: boolean = true;
  iocExpanded: boolean = true;
  entityfilterCategories: Record<string, string[]> = {};
  entityFilterCondition: boolean = false;
  isSidebarOpen: boolean = true;
  matchType: string = "";
  sortType: string = "";
}

export class ConfigSettings {
  appSettings: AppSettingsModel;
  localSettings: LocalSettingsModel;

  constructor(appSettings?: Partial<AppSettingsModel>, localSettings?: Partial<LocalSettingsModel>) {
    this.appSettings = Object.assign(new AppSettingsModel(), appSettings);
    this.localSettings = Object.assign(new LocalSettingsModel(), localSettings);
  }
}
