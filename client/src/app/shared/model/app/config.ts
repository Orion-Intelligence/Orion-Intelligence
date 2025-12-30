export class AppSettingsModel {
  ai_endpoint: string = '';
  version: string = '1.0.0';
  language_allowed: string = 'en';
  logo_url: string = '';
  app_name: string = '';
  api_allowed: string = '0';

  constructor(data?: Partial<Record<keyof AppSettingsModel, string | boolean>>) {
    if (data) {
      this.ai_endpoint = (data.ai_endpoint as string) || this.ai_endpoint;
      this.version = (data.version as string) || this.version;
      this.language_allowed = (data.language_allowed as string) || this.language_allowed;
      this.logo_url = (data.logo_url as string) || this.logo_url;
      this.api_allowed = (data.api_allowed as string) || this.api_allowed;
      this.app_name = (data.app_name as string) || this.app_name;
    }
  }
}

export class LocalSettingsModel {
  enable_advanced_tools: boolean = false;
  advance_setting_toggle: boolean = true;
  iocExpanded: boolean = true;
  entityfilterCategories: Record<string, string[]> = {};
  entityFilterCondition: boolean = true;
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
