import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ContextMenuType = 'user' | 'platform' | 'customEntity' | 'group';

export interface ContextMenuData {
    x: number;
    y: number;
    nodeId: string;
    type: ContextMenuType;
}

export type ContextMenuAction = 'fetchLinks' | 'clearConnections' | 'deleteProfile' | 'removeNode' | 'deleteEntity' | 'setAlias';

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

  menuPositionClass = computed(() => {
    const data = this.data();
    const fallbackClass = 'top-2 left-2';

    if (!data) {
      return fallbackClass;
    }

    if (typeof window === 'undefined') {
      return fallbackClass;
    }

    const isRightHalf = data.x > window.innerWidth / 2;
    const isBottomHalf = data.y > window.innerHeight / 2;

    if (isRightHalf && isBottomHalf) {
      return 'bottom-2 right-2';
    }

    if (isRightHalf) {
      return 'top-2 right-2';
    }

    if (isBottomHalf) {
      return 'bottom-2 left-2';
    }

    return 'top-2 left-2';
  });
}
