import { DatePipe, NgClass } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { finalize } from 'rxjs';

import { FeederScriptItem, FeederValueItem } from '../../../../../../shared/model/profile/feeder.model';
import { PaginationComponent } from '../../../../../../shared/partials/pagination/pagination.component';
import { ConfirmationPopupComponent } from '../../../../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { ScrollTopComponent } from '../../../../../../shared/partials/scroll-top/scroll-top.component';
import { AppService } from '../../../../../../services/core/app/app.service';
import { MessageNotificationService } from '../../../../../../services/message_notification/message-notification.service';
import { FeederService } from '../feeder.service';
import { SidebarUserFeederOwnerDialogComponent } from '../owner-dialog/sidebar-user-feeder-owner-dialog.component';

@Component({
  selector: 'app-sidebar-user-feeder-view',
  standalone: true,
  imports: [NgClass, DatePipe, PaginationComponent, ConfirmationPopupComponent, ScrollTopComponent, SidebarUserFeederOwnerDialogComponent],
  templateUrl: './sidebar-user-feeder-view.component.html',
})
export class SidebarUserFeederViewComponent implements OnChanges {
  private readonly oneDayMs = 24 * 60 * 60 * 1000;
  private readonly pageSize = 1000;
  private consumedHighlightedScriptId: string | null = null;
  private scriptTotal = 0;

  rawScripts: FeederScriptItem[] = [];
  scripts: FeederScriptItem[] = [];
  displayedScripts: FeederScriptItem[] = [];
  rawValues: FeederValueItem[] = [];
  displayedValues: FeederValueItem[] = [];
  valuesRecord: FeederScriptItem | null = null;
  selectedValueUrl: string | null = null;
  searchText = '';
  selectedScript: FeederScriptItem | null = null;
  isScriptsLoading = false;
  isOwnerDialogOpen = false;
  ownerDialogScript: FeederScriptItem | null = null;
  isConfirmationOpen = false;
  confirmationMessage = '';
  pendingAction: { type: 'clear' | 'delete' | 'toggle' | 'enableAll' | 'disableAll' | 'deleteValue'; script?: FeederScriptItem | null; value?: string | null; } | null = null;
  hasLoadedScripts = false;
  currentPage = 1;
  totalPages = 1;
  sortStatusDirection: 'asc' | 'desc' | null = null;
  readonly shimmerRows = Array.from({ length: 4 }, (_, index) => index);

  @Input() active = false;
  @Input() selectedRuleKey = '';
  @Input() entryType: 'scripts' | 'values' = 'scripts';
  @Input() highlightedScript: FeederScriptItem | null = null;

  constructor(private feederService: FeederService, private messageNotificationService: MessageNotificationService, private appService: AppService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['active'] && !changes['active'].currentValue) {
      this.closeScriptPreview();
    }

    if (changes['active']?.currentValue && !this.hasLoadedScripts) {
      this.loadScripts();
    }

    if (changes['selectedRuleKey'] || changes['entryType']) {
      this.currentPage = 1;
      this.consumedHighlightedScriptId = null;
      if (this.hasLoadedScripts) {
        this.loadScripts();
      }
      this.closeScriptPreview();
      this.selectedValueUrl = null;
    }

    if (changes['highlightedScript']) {
      const script = changes['highlightedScript'].currentValue as FeederScriptItem | null;
      if (!script) {
        this.consumedHighlightedScriptId = null;
        return;
      }
      if (script.id === this.consumedHighlightedScriptId) {
        return;
      }
      this.ensureScriptsLoadedAndOpen(script);
    }
  }

  canTransferOwnership(): boolean {
    return this.entryType !== 'values' && this.appService.userSessionData()?.user?.role === 'admin';
  }

  canTransferScript(script: FeederScriptItem): boolean {
    return this.canTransferOwnership() && script.entry_kind !== 'values';
  }

  canBulkToggle(): boolean {
    return this.scripts.some((script) => this.canToggleScript(script));
  }

  canToggleScript(script: FeederScriptItem): boolean {
    return this.entryType !== 'values' && script.entry_kind !== 'values';
  }

  loadScripts(): void {
    this.hasLoadedScripts = true;
    this.isScriptsLoading = true;
    const requestPage = this.entryType === 'values' ? 1 : this.currentPage;
    this.feederService.getScripts({
      ruleKey: this.selectedRuleKey || undefined,
      entryType: this.entryType,
      page: requestPage,
      limit: this.pageSize,
    })
      .pipe(finalize(() => {
        this.isScriptsLoading = false;
      }))
      .subscribe({
        next: (response) => {
          this.deferStateUpdate(() => {
            this.rawScripts = response?.scripts ?? [];
            this.scriptTotal = response?.total ?? this.rawScripts.length;
            this.applyLocalSearch();
            if (this.selectedScript) {
              this.selectedScript = this.scripts.find(script => script.id === this.selectedScript?.id) || null;
            }
            if (this.highlightedScript && this.highlightedScript.id !== this.consumedHighlightedScriptId) {
              const matched = this.scripts.find(script => script.id === this.highlightedScript?.id);
              if (matched) {
                this.openScript(matched);
                this.consumedHighlightedScriptId = matched.id;
              }
            }
          });
        },
        error: (error) => {
          this.messageNotificationService.show(error?.error?.detail || 'Failed to load feeder scripts');
        }
      });
  }

  getScriptPathLabel(script: FeederScriptItem | null | undefined): string {
    if (script?.entry_kind === 'values') {
      return 'Stored Rule Values';
    }
    return script?.path || script?.url || 'Unknown Path';
  }

  getSectionTitle(): string {
    if (this.entryType === 'values') {
      return 'Your Values';
    }
    return 'Your Scripts';
  }

  getSectionDescription(): string {
    if (this.entryType === 'values') {
      return 'Stored values for the selected platform.';
    }
    return 'Only scripts authored by your user are listed here.';
  }

  getEmptyStateDescription(): string {
    if (this.entryType === 'values') {
      return 'Use the Add tab to save URL values for this rule.';
    }
    return 'Use the Add tab to upload a parser or save URL values for this rule.';
  }

  getScriptDisplayName(script: FeederScriptItem): string {
    if (script.entry_kind === 'values') {
      return 'Stored Values';
    }
    return script.file_name || script.url || 'Untitled Entry';
  }

  getValueRowNumber(index: number): number {
    return ((this.currentPage - 1) * this.pageSize) + index + 1;
  }

  getValueStatus(value: FeederValueItem): 'success' | 'failure' | 'pending' {
    const runtimeStatus = this.getDateDerivedStatus(value.last_failure_date, value.last_success_date);
    if (runtimeStatus === 'success') {
      return 'success';
    }
    if (runtimeStatus === 'failed') {
      return 'failure';
    }
    if (value.status === 'success' || value.status === 'failure') {
      return value.status;
    }
    return 'pending';
  }

  getValueUpdatedAt(value: FeederValueItem): string | null {
    return value.last_checked_at || value.last_success_date || value.last_failure_date || null;
  }

  toggleStatusSort(): void {
    this.sortStatusDirection = this.sortStatusDirection === 'asc' ? 'desc' : 'asc';
    this.applyLocalSearch();
  }

  hasValuePreview(value: FeederValueItem): boolean {
    return !!(
      value.last_success_date
      || value.last_success_message
      || value.last_failure_date
      || value.last_failure_message
      || value.last_error
    );
  }

  toggleValuePreview(value: FeederValueItem): void {
    this.selectedValueUrl = this.selectedValueUrl === value.url ? null : value.url;
  }

  hasEntries(): boolean {
    return this.entryType === 'values' ? this.rawValues.length > 0 : this.scripts.length > 0;
  }

  toggleScript(script: FeederScriptItem): void {
    if (this.selectedScript?.id === script.id) {
      this.closeScriptPreview();
      return;
    }

    this.openScript(script);
  }

  closeScriptPreview(): void {
    this.selectedScript = null;
  }

  deleteScript(script: FeederScriptItem): void {
    this.feederService.deleteScript(script.id)
      .subscribe({
        next: (response) => {
          this.messageNotificationService.show(response?.message || 'Script deleted successfully', 'success');
          if (this.selectedScript?.id === script.id) {
            this.closeScriptPreview();
          }
          this.loadScripts();
        },
        error: (error) => {
          this.messageNotificationService.show(error?.error?.detail || 'Failed to delete');
        }
      });
  }

  deleteValue(script: FeederScriptItem, value: string): void {
    const url = value.trim();
    if (!url) {
      return;
    }

    this.feederService.deleteValue(script.id, url)
      .subscribe({
        next: (response) => {
          this.messageNotificationService.show(response?.message || 'Value deleted successfully', 'success');
          this.loadScripts();
        },
        error: (error) => {
          this.messageNotificationService.show(error?.error?.detail || 'Failed to delete value');
        }
      });
  }

  toggleScriptEnabled(script: FeederScriptItem): void {
    if (!this.canToggleScript(script)) {
      return;
    }

    this.feederService.toggleScript(script.id)
      .subscribe({
        next: (response) => {
          this.messageNotificationService.show(response?.message || 'Script status updated successfully', 'success');
          const updated = response?.script;
          if (updated) {
            this.rawScripts = this.rawScripts.map(item => item.id === updated.id ? updated : item);
            this.scripts = this.scripts.map(item => item.id === updated.id ? updated : item);
            this.displayedScripts = this.displayedScripts.map(item => item.id === updated.id ? updated : item);
            if (this.selectedScript?.id === updated.id) {
              this.selectedScript = updated;
            }
          }
          else {
            this.loadScripts();
          }
        },
        error: (error) => {
          this.messageNotificationService.show(error?.error?.detail || 'Failed to update script status');
        }
      });
  }

  clearAllForRule(): void {
    if (!this.selectedRuleKey) {
      return;
    }

    this.feederService.clearAllForRule(this.selectedRuleKey)
      .subscribe({
        next: (response) => {
          this.messageNotificationService.show(response?.message || 'Selected rule entries deleted successfully', 'success');
          this.closeScriptPreview();
          this.currentPage = 1;
          this.loadScripts();
        },
        error: (error) => {
          this.messageNotificationService.show(error?.error?.detail || 'Failed to clear selected rule entries');
        }
      });
  }

  setAllForRule(enabled: boolean): void {
    if (!this.selectedRuleKey) {
      return;
    }

    this.feederService.setAllForRule(this.selectedRuleKey, enabled)
      .subscribe({
        next: (response) => {
          this.messageNotificationService.show(response?.message || `Selected rule entries ${enabled ? 'enabled' : 'disabled'} successfully`, 'success');
          this.rawScripts = this.rawScripts.map(script => ({ ...script, enabled }));
          this.scripts = this.scripts.map(script => ({ ...script, enabled }));
          this.displayedScripts = this.displayedScripts.map(script => ({ ...script, enabled }));
          if (this.selectedScript) {
            this.selectedScript = { ...this.selectedScript, enabled };
          }
        },
        error: (error) => {
          this.messageNotificationService.show(error?.error?.detail || `Failed to ${enabled ? 'enable' : 'disable'} selected rule entries`);
        }
      });
  }

  openOwnerDialog(script: FeederScriptItem): void {
    if (!this.canTransferOwnership()) {
      return;
    }
    this.ownerDialogScript = script;
    this.isOwnerDialogOpen = true;
  }

  closeOwnerDialog(): void {
    this.isOwnerDialogOpen = false;
    this.ownerDialogScript = null;
  }

  onOwnerTransferSaved(): void {
    this.closeOwnerDialog();
    this.loadScripts();
  }

  getOwnerLabel(script: FeederScriptItem): string {
    if (script.owner_name) {
      return script.owner_name;
    }
    if (!script.owner_id) {
      return 'Unknown';
    }
    return 'Assigned';
  }

  getExpandedColspan(): number {
    return this.canTransferOwnership() ? 9 : 8;
  }

  getRuntimeStatus(script: FeederScriptItem): 'failed' | 'success' | 'unknown' {
    return this.getDateDerivedStatus(script.last_failure_date, script.last_success_date);
  }

  private getDateDerivedStatus(lastFailureDate?: string | null, lastSuccessDate?: string | null): 'failed' | 'success' | 'unknown' {
    const failureTime = lastFailureDate ? Date.parse(lastFailureDate) : NaN;
    const successTime = lastSuccessDate ? Date.parse(lastSuccessDate) : NaN;

    if (!Number.isNaN(failureTime)) {
      if (Number.isNaN(successTime) || successTime < failureTime - this.oneDayMs) {
        return 'failed';
      }
      return 'success';
    }
    if (!Number.isNaN(successTime)) {
      return 'success';
    }
    return 'unknown';
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadScripts();
    const container = document.getElementById('dashboard-container');
    if (container) {
      container.scrollTo({ top: 0, left: 0 });
    }
    else {
      window.scrollTo({ top: 0, left: 0 });
    }
  }

  onSearchInput(value: string): void {
    this.searchText = value;
    this.currentPage = 1;
    this.applyLocalSearch();
  }

  openConfirmation(action: 'clear' | 'delete' | 'toggle' | 'enableAll' | 'disableAll' | 'deleteValue', script?: FeederScriptItem | null, value?: string): void {
    this.pendingAction = { type: action, script: script || null, value: value || null };
    this.confirmationMessage = action === 'clear'
      ? 'Are you sure you want to delete all feeder entries for the selected rule?'
      : action === 'enableAll'
        ? 'Are you sure you want to enable all feeder entries for the selected rule?'
        : action === 'disableAll'
          ? 'Are you sure you want to disable all feeder entries for the selected rule?'
          : action === 'deleteValue'
            ? `Are you sure you want to delete this value${value ? `: ${value}` : ''}?`
            : action === 'delete'
              ? `Are you sure you want to delete ${this.formatDisplayName(script)}?`
              : `Are you sure you want to ${script?.enabled ? 'disable' : 'enable'} ${this.formatDisplayName(script)}?`;
    this.isConfirmationOpen = true;
  }

  handleConfirmation(confirmed: boolean): void {
    const action = this.pendingAction;
    this.isConfirmationOpen = false;
    this.pendingAction = null;

    if (!confirmed || !action) {
      return;
    }

    if (action.type === 'clear') {
      this.clearAllForRule();
      return;
    }
    if (action.type === 'enableAll') {
      this.setAllForRule(true);
      return;
    }
    if (action.type === 'disableAll') {
      this.setAllForRule(false);
      return;
    }
    if (action.type === 'delete' && action.script) {
      this.deleteScript(action.script);
      return;
    }
    if (action.type === 'deleteValue' && action.script && action.value) {
      this.deleteValue(action.script, action.value);
      return;
    }
    if (action.type === 'toggle' && action.script) {
      this.toggleScriptEnabled(action.script);
    }
  }

  private ensureScriptsLoadedAndOpen(script: FeederScriptItem): void {
    if (!this.hasLoadedScripts) {
      this.loadScripts();
      return;
    }

    const matched = this.scripts.find((item) => item.id === script.id);
    if (matched) {
      this.openScript(matched);
      this.consumedHighlightedScriptId = matched.id;
    }
  }

  private openScript(script: FeederScriptItem): void {
    this.selectedScript = script;
  }

  private formatDisplayName(script: FeederScriptItem | null | undefined): string {
    return script ? this.getScriptDisplayName(script) : 'this entry';
  }

  hasStatusPreview(script: FeederScriptItem | null | undefined): boolean {
    return !!script && !!(
      script.url
      || script.last_success_date
      || script.last_success_message
      || script.last_failure_date
      || script.last_failure_message
    );
  }

  formatPreviewMessage(message: string | null | undefined): string {
    if (!message) {
      return '-';
    }

    try {
      return JSON.stringify(this.stripEmbeddingField(JSON.parse(message)), null, 2);
    }
    catch {
      return message;
    }
  }

  private stripEmbeddingField(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.stripEmbeddingField(item));
    }

    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== 'm_embedding')
        .map(([key, nestedValue]) => [key, this.stripEmbeddingField(nestedValue)]);
      return Object.fromEntries(entries);
    }

    return value;
  }

  private applyLocalSearch(): void {
    const query = this.searchText.trim().toLowerCase();
    if (this.entryType === 'values') {
      const valuesRecord = this.rawScripts.find((script) => script.entry_kind === 'values') || null;
      const sharedValuesRecord = this.rawScripts.find((script) => script.entry_kind !== 'values' && !!(script.values || []).length) || null;
      this.valuesRecord = valuesRecord || sharedValuesRecord;
      const allValues = this.valuesRecord?.values || [];
      this.rawValues = [...allValues];
      const filteredValues = !query
        ? [...allValues]
        : allValues.filter((value) =>
          value.url.toLowerCase().includes(query)
          || (value.status || '').toLowerCase().includes(query)
          || (value.last_error || '').toLowerCase().includes(query));
      const totalValues = filteredValues.length;
      const sortedValues = this.sortStatusDirection
        ? [...filteredValues].sort((left, right) => {
          const result = this.getValueStatus(left).localeCompare(this.getValueStatus(right));
          return this.sortStatusDirection === 'asc' ? result : -result;
        })
        : filteredValues;
      this.totalPages = Math.max(1, Math.ceil(totalValues / this.pageSize));
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }
      const startIndex = (this.currentPage - 1) * this.pageSize;
      this.displayedValues = sortedValues.slice(startIndex, startIndex + this.pageSize);
      this.scripts = [];
      this.displayedScripts = [];
      return;
    }

    this.valuesRecord = null;
    if (!query) {
      this.scripts = [...this.rawScripts];
      this.displayedScripts = this.sortStatusDirection
        ? [...this.scripts].sort((left, right) => {
          const result = this.getRuntimeStatus(left).localeCompare(this.getRuntimeStatus(right));
          return this.sortStatusDirection === 'asc' ? result : -result;
        })
        : [...this.scripts];
      this.totalPages = Math.max(1, Math.ceil(this.scriptTotal / this.pageSize));
      return;
    }

    this.scripts = this.rawScripts.filter((script) => {
      const haystacks = [
        this.getScriptDisplayName(script),
        this.getScriptPathLabel(script),
        script.url || '',
        script.id,
      ];
      return haystacks.some(value => value.toLowerCase().includes(query));
    });
    this.displayedScripts = this.sortStatusDirection
      ? [...this.scripts].sort((left, right) => {
        const result = this.getRuntimeStatus(left).localeCompare(this.getRuntimeStatus(right));
        return this.sortStatusDirection === 'asc' ? result : -result;
      })
      : [...this.scripts];
    this.totalPages = 1;
  }

  private deferStateUpdate(callback: () => void): void {
    queueMicrotask(callback);
  }
}
