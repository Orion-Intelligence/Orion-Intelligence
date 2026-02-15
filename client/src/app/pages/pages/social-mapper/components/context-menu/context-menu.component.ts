import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ContextMenuType = 'user' | 'platform' | 'customEntity' | 'group';

export interface ContextMenuData {
    x: number;
    y: number;
    nodeId: string;
    type: ContextMenuType;
}

export type ContextMenuAction = 'fetchLinks' | 'clearConnections' | 'deleteProfile' | 'removeNode' | 'deleteEntity';

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './context-menu.component.html',
  styleUrls: ['../../social-mapper.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextMenuComponent {
  data = input.required<ContextMenuData | null>();

  action = output<ContextMenuAction>();
}