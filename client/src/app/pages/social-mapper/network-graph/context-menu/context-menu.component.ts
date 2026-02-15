import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextMenuComponent {
  data = input.required<ContextMenuData | null>();

  action = output<ContextMenuAction>();

  menuTitle = computed(() => {
    const data = this.data();
    if (!data) {
      return 'Actions';
    }
    if (data.type === 'user') {
      return 'Profile Actions';
    }
    if (data.type === 'platform') {
      return 'Platform Actions';
    }
    if (data.type === 'group') {
      return 'Group Actions';
    }
    return 'Entity Actions';
  });

  menuSubtitle = computed(() => {
    const data = this.data();
    if (!data) {
      return '';
    }

    if (data.type === 'user') {
      return `@${data.nodeId.substring('user-'.length)}`;
    }

    if (data.type === 'platform') {
      const parts = data.nodeId.substring('platform-'.length).split('|');
      if (parts.length >= 3) {
        const platform = parts[1];
        const username = parts.slice(2).join('|');
        return `${platform} / @${username}`;
      }
    }

    if (data.type === 'group') {
      return 'Grouped platform node';
    }

    return 'Custom entity';
  });

  menuPosition = computed(() => {
    const data = this.data();
    const fallbackPosition = { left: '8px', top: '8px' };

    if (!data) {
      return fallbackPosition;
    }

    if (typeof window === 'undefined') {
      return fallbackPosition;
    }

    const menuWidth = 256;
    const menuHeight = 280;
    const margin = 8;
    let x = data.x + margin;
    let y = data.y + margin;

    const maxX = window.innerWidth - menuWidth - margin;
    const maxY = window.innerHeight - menuHeight - margin;

    if (x > maxX) {
      x = Math.max(margin, maxX);
    }

    if (y > maxY) {
      y = Math.max(margin, maxY);
    }

    return { left: `${x}px`, top: `${y}px` };
  });
}
