type ConfigSettingsInput = {
  api_allowed?: string | boolean;
  telegram_allowed?: string | boolean;
  version?: string;
  language_allowed?: string;
  logo_url?: string;
};

export class ConfigSettings {
  api_allowed: boolean;
  telegram_allowed: boolean;
  version: string;
  language_allowed: string;
  logo_url: string;

  constructor(data: ConfigSettingsInput = {}) {
    this.api_allowed = data.api_allowed === true || data.api_allowed === '1';
    this.telegram_allowed = data.telegram_allowed === true || data.telegram_allowed === '1';
    this.version = data.version ?? '1.0.0';
    this.language_allowed = data.language_allowed ?? 'en';
    this.logo_url = data.logo_url ?? '';
  }
}

type ConfigDataInput = {
  settings?: ConfigSettingsInput;
};

export class ConfigData {
  settings: ConfigSettings;

  constructor(data: ConfigDataInput = {}) {
    this.settings = new ConfigSettings(data.settings ?? {});
  }
}
