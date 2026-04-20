import { Component, ChangeDetectionStrategy, ElementRef, HostListener, inject, signal, input, output } from '@angular/core';

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
  private tabManager = inject(TabManagerService, { optional: true });

  tabs = input<{ id: string; name: string; }[]>([]);
  activeTabId = input<string | null>(null);
  editingTabId = input<string | null>(null);
  mode = input<'social' | 'cti'>('social');
  manageReportExportInternally = input(true);
  isAddMenuVisible = signal(false);
  isHeaderMenuVisible = signal(false);
  isReportExportModalOpen = signal(false);
  readonly graphExportOptions = GRAPH_REPORT_EXPORT_OPTIONS;
  tabSelected = output<string>();
  tabClosed = output<string>();
  tabEditStarted = output<string>();
  tabRenameSubmitted = output<{ id: string; name: string; }>();
  tabRenameCancelled = output<undefined>();
  newSessionRequested = output<undefined>();
  exportCurrentRequested = output<undefined>();
  exportReportRequested = output<undefined>();
  fileSelected = output<Event>();

  constructor(private hostElementRef: ElementRef<HTMLElement>) {}

  private currentTabs(): { id: string; name: string; }[] {
    if (this.tabManager) {
      return this.tabManager.tabs();
    }
    return this.tabs();
  }

  private currentActiveTabId(): string | null {
    if (this.tabManager) {
      return this.tabManager.activeTabId();
    }
    return this.activeTabId();
  }

  private currentEditingTabId(): string | null {
    if (this.tabManager) {
      return this.tabManager.editingTabId();
    }
    return this.editingTabId();
  }

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
    if (!this.hostElementRef.nativeElement.contains(target)) {
      this.closeMenus();
    }
  }

  createNewTab() {
    if (this.tabManager) {
      this.tabManager.addTab();
    }
    else {
      this.newSessionRequested.emit(undefined);
    }
    this.closeMenus();
  }

  openReportExportModal() {
    if (!this.manageReportExportInternally()) {
      this.exportReportRequested.emit(undefined);
      return;
    }
    this.isReportExportModalOpen.set(true);
  }

  closeReportExportModal() {
    this.isReportExportModalOpen.set(false);
  }

  exportByType(type: string) {
    this.tabManager?.exportActiveTabReport(type as GraphReportExportType);
    this.closeReportExportModal();
  }

  onFileSelected(event: Event) {
    if (!this.tabManager) {
      this.fileSelected.emit(event);
      this.closeMenus();
      return;
    }
    const tabManager = this.tabManager;
    const selected = getFirstFileFromInputEvent(event);
    if (!selected) {
      return;
    }
    const { input, file } = selected;
    this.closeMenus();
    void readFileAsText(file)
      .then((content) => {
        try {
          tabManager.importTab(content);
        }
        catch {
          // Ignore invalid import payloads.
        }
      })
      .finally(() => {
        input.value = '';
      });
  }

  handleRename(tabId: string, input: HTMLInputElement) {
    if (this.tabManager) {
      this.tabManager.renameTab(tabId, input.value);
    }
    else {
      this.tabRenameSubmitted.emit({ id: tabId, name: input.value });
    }
  }

  cancelRename() {
    if (this.tabManager) {
      this.tabManager.stopEditing();
    }
    else {
      this.tabRenameCancelled.emit(undefined);
    }
  }

  trackById( _index: number, tab: { id: string; } ): string {
    return tab.id;
  }

  isPinnedPlaygroundTab(index: number): boolean {
    return this.mode() === 'cti' && index === 0;
  }

  displayTabName(index: number, name: string): string {
    return this.isPinnedPlaygroundTab(index) ? 'Playground' : name;
  }

  onTabNameDblClick(event: MouseEvent, index: number, tabId: string): void {
    event.stopPropagation();
    if (this.isPinnedPlaygroundTab(index)) {
      return;
    }
    this.startEditing(tabId);
  }

  isActiveTab(tabId: string): boolean {
    return this.currentActiveTabId() === tabId;
  }

  isEditingTab(tabId: string): boolean {
    return this.currentEditingTabId() === tabId;
  }

  selectTab(tabId: string) {
    if (this.currentEditingTabId() === tabId) {
      return;
    }
    if (this.tabManager) {
      this.tabManager.selectTab(tabId);
    }
    else {
      this.tabSelected.emit(tabId);
    }
  }

  startEditing(tabId: string) {
    if (this.tabManager) {
      this.tabManager.startEditing(tabId);
    }
    else {
      this.tabEditStarted.emit(tabId);
    }
  }

  closeTab(tabId: string) {
    if (this.tabManager) {
      this.tabManager.closeTab(tabId);
    }
    else {
      this.tabClosed.emit(tabId);
    }
  }

  exportCurrentSession() {
    if (this.tabManager) {
      this.tabManager.exportActiveTab();
    }
    else {
      this.exportCurrentRequested.emit(undefined);
    }
    this.closeMenus();
  }

  fileInputIdValue(): string {
    return this.mode() === 'cti' ? 'graphSessionFileInput' : 'fileInput';
  }

  testId(prefix: string): string {
    return `${this.mode()}-${prefix}`;
  }

  visibleTabs(): { id: string; name: string; }[] {
    return this.currentTabs();
  }
}
