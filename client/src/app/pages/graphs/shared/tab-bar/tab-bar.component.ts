import { Component, ChangeDetectionStrategy, ElementRef, HostListener, inject, signal } from '@angular/core';

import { TabManagerService } from '../services/tab-manager.service';
import { AutofocusDirective } from '../../../../shared/directives/autofocus.directive';
import { ProfileComponent } from '../../../../shared/partials/profile/profile.component';
import { ExportChoiceModalComponent } from '../../../../shared/partials/export-choice-modal/export-choice-modal.component';
import { GraphReportExportType } from '../../../../shared/model/report/report-export.model';
import { GRAPH_REPORT_EXPORT_OPTIONS } from '../../../../shared/model/report/export-choice.model';
import { getFirstFileFromInputEvent, readFileAsText } from '../../../../shared/utils/file-input.util';
@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AutofocusDirective, ProfileComponent, ExportChoiceModalComponent],
})
export class TabBarComponent {
  private hostRef = inject(ElementRef<HTMLElement>);

  isAddMenuVisible = signal(false);
  isHeaderMenuVisible = signal(false);
  isReportExportModalOpen = signal(false);
  readonly graphExportOptions = GRAPH_REPORT_EXPORT_OPTIONS;

  constructor(public tabManager: TabManagerService) { }

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }
    if (!this.hostRef.nativeElement.contains(target)) {
      this.closeMenus();
    }
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

  exportByType(type: string) {
    this.tabManager.exportActiveTabReport(type as GraphReportExportType);
    this.closeReportExportModal();
  }

  onFileSelected(event: Event) {
    const selected = getFirstFileFromInputEvent(event);
    if (!selected) {
      return;
    }
    const { input, file } = selected;
    this.closeMenus();
    readFileAsText(file)
      .then((content) => {
        try {
          this.tabManager.importTab(content);
        }
        catch {
        }
      })
      .finally(() => {
        input.value = ''; 
      });
  }

  handleRename(tabId: string, input: HTMLInputElement) {
    this.tabManager.renameTab(tabId, input.value);
  }

  cancelRename() {
    this.tabManager.stopEditing();
  }

  trackById( _index: number, tab: { id: string; } ): string {
    return tab.id;
  }
}
