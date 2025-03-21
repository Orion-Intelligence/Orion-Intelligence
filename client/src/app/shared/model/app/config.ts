export class ConfigSettings {
  api_allowed: string;
  version: string;
  language_allowed: string;

  constructor(data: Partial<ConfigSettings> = {}) {
    this.api_allowed = data.api_allowed ?? '0';
    this.version = data.version ?? '1.0.0';
    this.language_allowed = data.language_allowed ?? 'en';
  }
}

export class ConfigData {
  settings: ConfigSettings;

  constructor(data: Partial<ConfigData> = {}) {
    this.settings = new ConfigSettings(data.settings ?? {});
  }
}
