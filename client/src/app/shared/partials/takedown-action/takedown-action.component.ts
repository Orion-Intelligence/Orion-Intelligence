import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';
import { TakedownActionResponse, TakedownActionResult } from '../../model/takedown/takedown.model';

@Component({
  selector: 'app-takedown-action',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass, TooltipDirective],
  templateUrl: './takedown-action.component.html'
})
export class TakedownActionComponent implements OnChanges {
  private http = inject(HttpClient);

  isTakingDown: boolean = false;
  showTakedownModal: boolean = false;
  actionResult: TakedownActionResult | null = null;
  takedownLabel: string = '';
  takedownDisabled: boolean = false;
  manualTargetUrl = '';
  manualUrlError = '';

  @Input() reportId: string = '';
  @Input() targetUrl: string | null | undefined = '';
  @Input() status: string | null = null;
  @Input() statusLabel: string = '';
  @Input() manualUrlMode: boolean = false;
  @Input() actionLabel: string = 'Initiate Takedown';
  @Input() buttonClass: string = '';
  @Input() buttonIcon: string = '';
  @Output() requestCreated = new EventEmitter<TakedownActionResponse>();

  ngOnChanges(_: SimpleChanges): void {
    this.applyTakedownStatus(this.status, this.statusLabel);
  }

  get canInitiateTakedown(): boolean {
    if (this.manualUrlMode) {
      return !this.isTakingDown;
    }
    const hasReportTarget = !!this.targetUrl && !!this.reportId;
    const requestInProgress = this.isTakingDown || this.takedownDisabled;
    return hasReportTarget && !requestInProgress;
  }

  get buttonLabel(): string {
    if (this.isTakingDown) {
      return 'Creating request';
    }
    if (this.isTakedownAccepted) {
      return 'Takedown reported';
    }
    if (this.manualUrlMode) {
      return this.actionLabel;
    }
    return this.takedownLabel || this.actionLabel;
  }

  get isTakedownInProgress(): boolean {
    return this.status === 'in_progress' || this.takedownLabel.toLowerCase().includes('in progress');
  }

  get isTakedownDenied(): boolean {
    return this.status === 'denied' || this.takedownLabel.toLowerCase().includes('denied');
  }

  get isTakedownAccepted(): boolean {
    const label = this.takedownLabel.toLowerCase();
    return this.status === 'accepted' || label.includes('accepted') || label.includes('reported');
  }

  get buttonClasses(): string {
    if (this.isTakingDown) {
      return 'border-[rgba(87,165,235,0.42)] bg-[rgba(87,165,235,0.14)] text-[#8bc8ff] shadow-[0_0_0_1px_rgba(87,165,235,0.10),0_8px_18px_rgba(87,165,235,0.10)] cursor-wait';
    }
    if (this.buttonClass && this.canInitiateTakedown) {
      return 'shadow-[0_8px_18px_rgba(44,122,197,0.18)] hover:-translate-y-[1px] active:translate-y-0';
    }
    if (this.canInitiateTakedown) {
      return 'border-[rgba(87,165,235,0.55)] bg-[var(--color-blue-640)] text-white shadow-[0_8px_18px_rgba(44,122,197,0.22)] hover:-translate-y-[1px] hover:bg-[rgba(87,165,235,0.92)] active:translate-y-0';
    }
    if (this.isTakedownAccepted) {
      return 'border-[rgba(40,167,69,0.42)] bg-[rgba(40,167,69,0.14)] text-[#7ee787] shadow-[0_0_0_1px_rgba(40,167,69,0.10),0_8px_18px_rgba(40,167,69,0.10)] cursor-default';
    }
    if (this.isTakedownDenied) {
      return 'border-[rgba(255,107,107,0.42)] bg-[rgba(255,107,107,0.13)] text-[#ff8a8a] shadow-[0_0_0_1px_rgba(255,107,107,0.10),0_8px_18px_rgba(255,107,107,0.08)] cursor-default';
    }
    if (this.isTakedownInProgress) {
      return 'border-[rgba(87,165,235,0.42)] bg-[rgba(87,165,235,0.14)] text-[#8bc8ff] shadow-[0_0_0_1px_rgba(87,165,235,0.10),0_8px_18px_rgba(87,165,235,0.10)] cursor-default';
    }
    return 'border-[var(--color-border)] bg-[var(--color-blue-760)] text-[var(--color-text4)] opacity-80 cursor-not-allowed';
  }

  get buttonBaseClasses(): string {
    if (this.buttonClass) {
      return `${this.buttonClass} gap-2`;
    }
    return 'shrink-0 min-h-9 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] rounded-[8px] border transition-all duration-200 inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/30';
  }

  get buttonIconClass(): string {
    if (this.buttonIcon) {
      return this.buttonIcon;
    }
    if (this.isTakedownAccepted) {
      return 'bi-check2-circle';
    }
    if (this.isTakedownDenied) {
      return 'bi-x-circle-fill';
    }
    if (this.isTakedownInProgress) {
      return 'bi-hourglass-split';
    }
    if (!this.canInitiateTakedown) {
      return 'bi-shield-lock';
    }
    return 'bi-shield-exclamation';
  }

  get buttonTooltip(): string {
    if (this.isTakingDown) {
      return 'Creating takedown request';
    }
    if (this.isTakedownAccepted) {
      return 'Takedown has been reported';
    }
    if (this.isTakedownDenied) {
      return 'Takedown request was denied';
    }
    if (this.isTakedownInProgress) {
      return 'Takedown request is under review';
    }
    if (!this.canInitiateTakedown) {
      return 'Takedown is unavailable';
    }
    return 'Open Takedown Evidence Panel';
  }

  initiateTakedown(): void {
    if (!this.canInitiateTakedown) {
      return;
    }

    this.showTakedownModal = true;
    this.actionResult = null;
    this.manualUrlError = '';

    if (this.manualUrlMode) {
      this.manualTargetUrl = '';
      return;
    }

    this.createTakedownRequest(String(this.targetUrl || ''));
  }

  submitManualTakedown(): void {
    const targetUrl = this.manualTargetUrl.trim();
    this.manualUrlError = '';
    if (!targetUrl) {
      this.manualUrlError = 'Target URL is required.';
      return;
    }
    this.createTakedownRequest(targetUrl);
  }

  private createTakedownRequest(targetUrl: string): void {
    this.isTakingDown = true;
    this.actionResult = null;

    const payload = {
      report_id: this.reportId || '',
      target_url: targetUrl
    };

    this.http.post<TakedownActionResponse>('/api/takedowns', payload).subscribe({
      next: record => {
        this.handleSuccess(record);
      },
      error: () => {
        this.isTakingDown = false;
        this.actionResult = { error: 'No public abuse contact was exposed for this site.' };
      }
    });
  }

  closeTakedownModal(): void {
    this.showTakedownModal = false;
    this.isTakingDown = false;
  }

  private applyTakedownStatus(status: string | null, label: string = ''): void {
    this.takedownLabel = label;
    this.takedownDisabled = !!status || !!label;
  }

  private handleSuccess(record: TakedownActionResponse): void {
    this.isTakingDown = false;
    const evidence = (record.evidence?.result || record.evidence || {}) as Record<string, unknown>;
    const abuseEmail = record.abuse_email || String(evidence['abuse_email_found'] || '');
    if (!abuseEmail) {
      this.actionResult = { error: 'No public abuse contact was exposed for this site.' };
      return;
    }
    if (!this.manualUrlMode) {
      this.applyTakedownStatus(record.public_status || null, record.status_label || '');
    }
    this.actionResult = {
      abuse_email: abuseEmail,
      status_label: record.status_label || this.takedownLabel || 'Takedown request created'
    };
    this.requestCreated.emit(record);
  }
}
