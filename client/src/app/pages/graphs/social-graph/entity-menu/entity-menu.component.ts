import { Component, ChangeDetectionStrategy, input, output, signal, inject } from '@angular/core';

import { CustomEntity } from '../../../../shared/model/social/social-scan.models';
import { SocialEntityUiService } from '../services/social-entity-ui.service';
const ENTITY_ADD_OPTIONS: { type: CustomEntity['type']; label: string; iconClass: string; }[] = [
  { type: 'email-breach', label: 'Add Email Breach', iconClass: 'bi bi-person-badge text-indigo-400' },
  { type: 'wanted-list', label: 'Add Wanted List', iconClass: 'bi bi-person-exclamation text-indigo-400' },
  { type: 'phone', label: 'Add Phone', iconClass: 'bi bi-telephone text-indigo-400' },
  { type: 'crypto-scanner', label: 'Add Crypto Scanner', iconClass: 'bi bi-currency-bitcoin text-green-400' }
];
@Component({
  selector: 'app-entity-menu',
  templateUrl: './entity-menu.component.html',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityMenuComponent {
  readonly socialEntityUiService = inject(SocialEntityUiService);
  isCollapsed = input.required<boolean>();
  isSmallScreen = input.required<boolean>();
  customEntities = input.required<CustomEntity[]>();
  toggle = output<undefined>();
  addEntityClicked = output<CustomEntity['type']>();
  entityClicked = output<string>();
  deleteEntityClicked = output<string>();
  mobilePanelOpen = signal(false);
  addSearchTerm = signal('');
  entityAddOptions = ENTITY_ADD_OPTIONS;

  get filteredEntityAddOptions(): { type: CustomEntity['type']; label: string; iconClass: string; }[] {
    const term = this.addSearchTerm().trim().toLowerCase();
    if (!term) {
      return this.entityAddOptions;
    }
    return this.entityAddOptions.filter(option => option.label.toLowerCase().includes(term));
  }

  onAddSearchInput(event: Event) {
    const nextValue = (event.target as HTMLInputElement | null)?.value ?? '';
    this.addSearchTerm.set(nextValue);
  }

  toggleMobilePanel(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.mobilePanelOpen.update(v => !v);
  }

  closeMobilePanel() {
    this.mobilePanelOpen.set(false);
  }
}
