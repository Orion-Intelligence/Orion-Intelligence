import { UiDropdownOption } from '../../../shared/partials/ui-dropdown/ui-dropdown.component';
import { TranslationService } from '../../../shared/services/translation.service';

export function buildTenantStatusOptions(translationService: TranslationService): UiDropdownOption[] {
  translationService.version();
  return [
    { key: 'active', label: translationService.translate('Active') },
    { key: 'disable', label: translationService.translate('Disable') }
  ];
}

export function buildTenantBasePermissionOptions(translationService: TranslationService): UiDropdownOption[] {
  translationService.version();
  return [
    { key: 'case_management', label: translationService.translate('Case Management') },
    { key: 'dismiss_result', label: translationService.translate('Dismiss Result') }
  ];
}
