import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabManagerService } from '../services/tab-manager.service';
import { AutofocusDirective } from '../../../shared/directives/autofocus.directive';

@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, AutofocusDirective],
})
export class TabBarComponent {
  isAddMenuVisible = signal(false);
  isHeaderMenuVisible = signal(false);

  constructor(public tabManager: TabManagerService) {}

  toggleAddMenu(event: MouseEvent) {
    event.stopPropagation();
    this.isAddMenuVisible.update(v => !v);
    this.isHeaderMenuVisible.set(false);
  }

  toggleHeaderMenu(event: MouseEvent) {
    event.stopPropagation();
    this.isHeaderMenuVisible.update(v => !v);
    this.isAddMenuVisible.set(false);
  }

  closeMenus() {
    this.isAddMenuVisible.set(false);
    this.isHeaderMenuVisible.set(false);
  }

  createNewTab() {
    this.tabManager.addTab();
    this.closeMenus();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          this.tabManager.importTab(content);
        } catch {
        }
      };
      reader.readAsText(file);
      input.value = ''; 
    }
  }

  handleRename(tabId: string, input: HTMLInputElement) {
    this.tabManager.renameTab(tabId, input.value);
  }

  cancelRename() {
    this.tabManager.stopEditing();
  }

  trackById(_index: number, tab: { id: string }): string {
    return tab.id;
  }
}
