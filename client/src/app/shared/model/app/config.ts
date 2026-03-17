export class AppSettingsModel {
  ai_endpoint: string = '';
  version: string = '1.0.0';
  language_allowed: string = 'en';
  logo_url: string = '';
  logo_wide_light: string = '';
  logo_wide_dark: string = '';
  app_name: string = '';
  meta_info: string = '';
  home_header_data_sources: string = '';
  home_header_adversaries: string = '';
  home_header_pricing: string = '';
  home_header_pricing_allowed: boolean = true;
  home_header_whistle_blowing_allowed: boolean = false;
  s_onion: string = '';
  api_allowed: string = '0';

  constructor(data?: Partial<Record<keyof AppSettingsModel, string | boolean>>) {
    if (data) {
      this.ai_endpoint = (data.ai_endpoint as string) || this.ai_endpoint;
      this.version = (data.version as string) || this.version;
      this.language_allowed = (data.language_allowed as string) || this.language_allowed;
      this.logo_url = (data.logo_url as string) || this.logo_url;
      this.logo_wide_light = (data.logo_wide_light as string) || this.logo_wide_light;
      this.logo_wide_dark = (data.logo_wide_dark as string) || this.logo_wide_dark;
      this.api_allowed = (data.api_allowed as string) || this.api_allowed;
      this.app_name = (data.app_name as string) || this.app_name;
      this.meta_info = (data.meta_info as string) || this.meta_info;
      this.s_onion = (data.s_onion as string) || this.s_onion;
      this.applyMetaInfo();
    }
  }

  private applyMetaInfo(): void {
    try {
      const parsed = this.meta_info ? JSON.parse(this.meta_info) : {};
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return;
      }
      this.home_header_data_sources = typeof parsed.S_HOME_HEADER_DATA_SOURCES === 'string' ? parsed.S_HOME_HEADER_DATA_SOURCES : this.home_header_data_sources;
      this.home_header_adversaries = typeof parsed.S_HOME_HEADER_ADVERSARIES === 'string' ? parsed.S_HOME_HEADER_ADVERSARIES : this.home_header_adversaries;
      this.home_header_pricing = typeof parsed.S_HOME_HEADER_PRICING === 'string' ? parsed.S_HOME_HEADER_PRICING : this.home_header_pricing;
      this.home_header_pricing_allowed = typeof parsed.S_HOME_HEADER_PRICING_ALLOWED === 'boolean' ? parsed.S_HOME_HEADER_PRICING_ALLOWED : this.home_header_pricing_allowed;
      this.home_header_whistle_blowing_allowed = typeof parsed.S_HOME_HEADER_WHISTLE_BLOWING_ALLOWED === 'boolean' ? parsed.S_HOME_HEADER_WHISTLE_BLOWING_ALLOWED : this.home_header_whistle_blowing_allowed;
    }
    catch {
      return;
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
    this.appSettings = new AppSettingsModel(appSettings as Partial<Record<keyof AppSettingsModel, string | boolean>> | undefined);
    this.localSettings = Object.assign(new LocalSettingsModel(), localSettings);
  }
}
