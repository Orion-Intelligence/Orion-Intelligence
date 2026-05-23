import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { IpDetail } from '../../../../shared/model/network-intel/network-intel.model';
import { NetworkIntelScanService } from '../../../../shared/services/network-intel/network-intel-scan.service';
import { IpDetailComponent } from '../../../root-searches/network-intel/ip-detail/ip-detail.component';

@Component({
  selector: 'app-threat-lens-ip-detail-popup',
  standalone: true,
  imports: [CommonModule, IpDetailComponent],
  templateUrl: './ip-detail-popup.component.html',
})
export class IpDetailPopupComponent implements OnChanges, OnDestroy {
  private requestId = 0;
  private detailSub?: Subscription;

  isLoading = false;
  errorMessage: string | null = null;
  detail: IpDetail | null = null;
  progress = 0;
  currentStep = '';

  @Input() ip = '';

  @Output() close = new EventEmitter<void>();

  constructor(private networkIntelService: NetworkIntelScanService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ip'] && this.ip.trim()) {
      this.loadDetail(this.ip.trim());
    }
  }

  ngOnDestroy(): void {
    this.cancelPendingRequest();
  }

  onClose(): void {
    this.cancelPendingRequest();
    this.close.emit();
  }

  private loadDetail(ip: string): void {
    this.cancelPendingRequest();
    const requestId = ++this.requestId;
    this.isLoading = true;
    this.errorMessage = null;
    this.detail = null;
    this.progress = 0;
    this.currentStep = 'Loading IP details...';

    this.detailSub = this.networkIntelService.fetchShodanIpDetail$(ip, (response) => {
      if (requestId !== this.requestId) {
        return;
      }
      this.progress = this.networkIntelService.getProgressValue(response?.result?.['progress'] ?? response?.['progress']);
      this.currentStep = this.networkIntelService.getLoadingStepLabel(response?.result?.['step'] || response?.['step'] || response?.result?.status || response?.status);
    }).subscribe({
      next: (detail) => {
        if (requestId !== this.requestId) {
          return;
        }
        const payload: Record<string, any> = detail && typeof detail === 'object' ? detail : {};
        this.detail = { ...payload, ip: payload['ip'] || ip };
        this.isLoading = false;
        this.currentStep = '';
      },
      error: (error) => {
        if (requestId !== this.requestId) {
          return;
        }
        this.errorMessage = error?.message || 'Failed to load IP details.';
        this.isLoading = false;
      },
    });
  }

  private cancelPendingRequest(): void {
    this.requestId += 1;
    this.detailSub?.unsubscribe();
    this.detailSub = undefined;
  }
}
