import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabManagerService } from '../services/tab-manager.service';
import { AutofocusDirective } from '../../../../shared/directives/autofocus.directive';
import { ProfileComponent } from '../../../../shared/partials/profile/profile.component';
import { ReportExportModalComponent } from '../report-export-modal/report-export-modal.component';
import { GraphReportExportType } from '../services/graph-report-export.service';
import { getFirstFileFromInputEvent, readFileAsText } from '../../../../shared/utils/file-input.util';

@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, AutofocusDirective, ProfileComponent, ReportExportModalComponent],
})
export class TabBarComponent {
  isAddMenuVisible = signal(false);
  isHeaderMenuVisible = signal(false);
  isReportExportModalOpen = signal(false);

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

  openReportExportModal() {
    this.isReportExportModalOpen.set(true);
  }

  closeReportExportModal() {
    this.isReportExportModalOpen.set(false);
  }

  exportByType(type: GraphReportExportType) {
    this.tabManager.exportActiveTabReport(type);
    this.closeReportExportModal();
  }

  onFileSelected(event: Event) {
    const selected = getFirstFileFromInputEvent(event);
    if (!selected) {
      return;
    }
    const { input, file } = selected;
    readFileAsText(file)
      .then((content) => {
        try {
          this.tabManager.importTab(content);
        } catch {
        }
      })
      .finally(() => { input.value = ''; });
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
