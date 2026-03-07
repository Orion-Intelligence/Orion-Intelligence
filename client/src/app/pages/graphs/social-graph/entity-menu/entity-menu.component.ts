import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';

import { CustomEntity } from '../../../../shared/model/social/social-scan.models';
const ENTITY_ADD_OPTIONS: Array<{ type: CustomEntity['type']; label: string; iconClass: string; }> = [
  { type: 'email-breach', label: 'Add Email Breach', iconClass: 'bi bi-person-badge text-indigo-400' },
  { type: 'social-scanner', label: 'Add Social Scanner', iconClass: 'bi bi-people text-indigo-400' },
  { type: 'wanted-list', label: 'Add Wanted List', iconClass: 'bi bi-person-exclamation text-indigo-400' },
  { type: 'national-identity', label: 'Add National Identity', iconClass: 'bi bi-card-text text-indigo-400' },
  { type: 'playstore-scanner', label: 'Add Playstore Scanner', iconClass: 'bi bi-google-play text-indigo-400' },
  { type: 'software-scanner', label: 'Add Software Scanner', iconClass: 'bi bi-window text-indigo-400' },
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
  isCollapsed = input.required<boolean>();
  isSmallScreen = input.required<boolean>();
  customEntities = input.required<CustomEntity[]>();
  toggle = output<void>();
  addEntityClicked = output<CustomEntity['type']>();
  entityClicked = output<string>();
  deleteEntityClicked = output<string>();
  mobilePanelOpen = signal(false);
  addSearchTerm = signal('');
  entityAddOptions = ENTITY_ADD_OPTIONS;

  get filteredEntityAddOptions(): Array<{ type: CustomEntity['type']; label: string; iconClass: string; }> {
    const term = this.addSearchTerm().trim().toLowerCase();
    if (!term) {
      return this.entityAddOptions;
    }
    return this.entityAddOptions.filter(option => option.label.toLowerCase().includes(term));
  }

  onAddSearchInput(event: Event) {
    this.addSearchTerm.set((event.target as HTMLInputElement).value);
  }

  getIconForEntityType(type: CustomEntity['type']): string {
    switch (type) {
      case 'wallet': return 'bi bi-wallet2 text-green-400';
      case 'email': return 'bi bi-envelope-at text-yellow-400';
      case 'domain': return 'bi bi-globe text-sky-400';
      case 'domain-scan': return 'bi bi-globe2 text-sky-400';
      case 'subdomains-scan': return 'bi bi-diagram-3 text-sky-400';
      case 'dns-scan': return 'bi bi-broadcast text-sky-400';
      case 'wayback-scan': return 'bi bi-clock-history text-sky-400';
      case 'email-breach': return 'bi bi-person-badge text-indigo-400';
      case 'social-scanner': return 'bi bi-people text-indigo-400';
      case 'wanted-list': return 'bi bi-person-exclamation text-indigo-400';
      case 'national-identity': return 'bi bi-card-text text-indigo-400';
      case 'playstore-scanner': return 'bi bi-google-play text-indigo-400';
      case 'software-scanner': return 'bi bi-window text-indigo-400';
      case 'phone': return 'bi bi-telephone text-indigo-400';
      case 'ioc-extract': return 'bi bi-file-earmark-code text-indigo-400';
      case 'apk-scan': return 'bi bi-android2 text-indigo-400';
      case 'crypto-scanner': return 'bi bi-currency-bitcoin text-green-400';
      default: return 'bi bi-circle text-slate-400';
    }
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
