import { FilterCategory } from "../filter/filter.model";

interface ConfigSettingsInput {
  api_allowed?: string | boolean;
  telegram_allowed?: string | boolean;
  version?: string;
  language_allowed?: string;
  logo_url?: string;
  enable_advanced_tools?: string | boolean;
  advance_setting_toggle?: boolean;
}
export interface LocalSettingsInput {
  advance_setting_toggle?: boolean;
  iocExpanded?: boolean;
  entityFilterCondition?: boolean;
  sidebarFilters?: Record<string, { title: string; selected: string | string[] }>;
  entityfilterCategories?: FilterCategory[];
  selectedEntityCategoryId?: string;
}
export interface AppSettings extends LocalSettingsInput {
  api_allowed: boolean;
  telegram_allowed: boolean;
  version: string;
  language_allowed: string;
  logo_url: string;
  enable_advanced_tools: boolean;
}

export class ConfigSettings {
  api_allowed: boolean;
  telegram_allowed: boolean;
  version: string;
  language_allowed: string;
  logo_url: string;
  enable_advanced_tools: boolean;

  advance_setting_toggle: boolean;
  iocExpanded: boolean;
  entityFilterCondition: boolean;
  sidebarFilters: Record<string, { title: string; selected: string | string[] }>;
  entityfilterCategories: FilterCategory[];
  selectedEntityCategoryId: string;

  constructor(apiData: ConfigSettingsInput = {}, localData: LocalSettingsInput = {}) {
    this.api_allowed = apiData.api_allowed === true || apiData.api_allowed === '1';
    this.telegram_allowed = apiData.telegram_allowed === true || apiData.telegram_allowed === '1';
    this.version = apiData.version ?? '1.0.0';
    this.language_allowed = apiData.language_allowed ?? 'en';
    this.logo_url = apiData.logo_url ?? '';
    this.enable_advanced_tools = apiData.enable_advanced_tools === true || apiData.enable_advanced_tools === 'true';

    this.advance_setting_toggle = localData.advance_setting_toggle ?? false;
    this.iocExpanded = localData.iocExpanded ?? false;
    this.entityFilterCondition = localData.entityFilterCondition ?? false;
    this.sidebarFilters = localData.sidebarFilters ?? {};
    this.entityfilterCategories = localData.entityfilterCategories ?? [];
    this.selectedEntityCategoryId = localData.selectedEntityCategoryId ?? '';
  }
}

interface ConfigDataInput {
  settings?: ConfigSettingsInput;
}

export class ConfigData {
  settings: ConfigSettings;

  constructor(data: ConfigDataInput = {}) {
    this.settings = new ConfigSettings(data.settings ?? {});
  }
}
export class AppConfigData {
  settings: ConfigSettings;

  constructor(data: ConfigDataInput = {}, localData: LocalSettingsInput = {}) {
    this.settings = new ConfigSettings(data.settings ?? {}, localData);
  }
}
