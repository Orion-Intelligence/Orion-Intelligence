import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { IpDetail } from '../../../../shared/model/network-intel/network-intel.model';
import { IpDetailComponent } from '../../../root-searches/network-intel/ip-detail/ip-detail.component';
import { ThreatLensService } from '../threat.lens.service';

@Component({
  selector: 'app-threat-lens-ip-detail-popup',
  standalone: true,
  imports: [CommonModule, IpDetailComponent],
  templateUrl: './threat-lens-ip-detail-popup.html',
})
export class ThreatLensIpDetailPopupComponent implements OnChanges, OnDestroy {
  private detailSub: Subscription | null = null;
  private requestId = 0;
  private destroyed = false;

  detail: IpDetail | null = null;
  isLoading = false;
  errorMessage = '';

  @Input() ip = '';

  @Output() closePopup = new EventEmitter<void>();

  constructor(private threatLensService: ThreatLensService, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ip'] && this.ip.trim()) {
      void this.loadIpDetail();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.requestId += 1;
    this.cancelIpDetailRequest();
  }

  loadIpDetail(): void {
    const normalizedIp = this.ip.trim();
    if (!normalizedIp) {
      return;
    }

    this.cancelIpDetailRequest();
    const requestId = ++this.requestId;
    this.detail = null;
    this.errorMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges();

    this.detailSub = this.threatLensService.scanIpDetail(normalizedIp).subscribe({
      next: (detail) => {
        if (!this.isActiveRequest(requestId)) {
          return;
        }

        this.detail = detail;
        this.errorMessage = '';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        if (!this.isActiveRequest(requestId)) {
          return;
        }

        this.detail = null;
        this.errorMessage = error?.message || 'Failed to load IP details.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  close(): void {
    this.requestId += 1;
    this.cancelIpDetailRequest();
    this.closePopup.emit();
  }

  private cancelIpDetailRequest(): void {
    this.detailSub?.unsubscribe();
    this.detailSub = null;
  }

  private isActiveRequest(requestId: number): boolean {
    return !this.destroyed && requestId === this.requestId;
  }
}
