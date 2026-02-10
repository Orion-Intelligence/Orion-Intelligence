import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomEntity } from '../../../shared/model/social/social-scan.models';

@Component({
  selector: 'app-entity-menu',
  templateUrl: './entity-menu.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityMenuComponent {
  isCollapsed = input.required<boolean>();
  toggle = output<void>();
  addEntityClicked = output<CustomEntity['type']>();
}
