import { AppService } from '../../../services/core/app/app.service';
import { AppSettingsModel, ConfigSettings } from '../../../shared/model/app/config';

export const DEFAULT_APP_NAME = 'Orion Intelligence';

export function applyAppSettings(appService: AppService, settings: Partial<AppSettingsModel>): void {
  const current = appService.configData();
  const appSettings = { ...current.appSettings, ...settings };
  appService.configData.set(new ConfigSettings(appSettings, current.localSettings));
  const updated = appService.configData().appSettings;
  appService.updateFavicon(updated.logo_url);
  document.title = updated.app_name?.trim() || DEFAULT_APP_NAME;
}
