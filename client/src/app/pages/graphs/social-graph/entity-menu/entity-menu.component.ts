import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomEntity } from '../../../../shared/model/social/social-scan.models';

@Component({
  selector: 'app-entity-menu',
  templateUrl: './entity-menu.component.html',
  standalone: true,
  imports: [CommonModule],
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

  getIconForEntityType(type: CustomEntity['type']): string {
    switch (type) {
      case 'wallet': return 'bi bi-wallet2 text-green-400';
      case 'email': return 'bi bi-envelope-at text-yellow-400';
      case 'domain': return 'bi bi-globe text-sky-400';
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
