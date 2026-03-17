import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { DnsResult, IpRowState } from '../../../shared/model/network-intel/network-intel.model';
import { IpDetailComponent } from '../ip-detail/ip-detail.component';

@Component({
  selector: 'app-network-intel-dns-section',
  standalone: true,
  imports: [CommonModule, IpDetailComponent],
  templateUrl: './dns-section.component.html',
})
export class DnsSectionComponent {
  @Input() isScanning = false;
  @Input() progress = 0;
  @Input() currentStep = '';
  @Input() progressSegments: number[] = [];
  @Input() errorMessage: string | null = null;
  @Input() hasSearched = false;
  @Input() dnsResult: DnsResult | null = null;
  @Input() ipRows: IpRowState[] = [];

  @Output() toggleRow = new EventEmitter<IpRowState>();

  constructor(private router: Router) {}

  get isEmbeddedInConsolidated(): boolean {
    return this.router.url.includes('/consolidated');
  }

  get progressValue(): number {
    return Math.max(6, Math.min(100, Math.round(this.progress || 0)));
  }

  get loadingStepLabel(): string {
    const raw = (this.currentStep || '').trim();
    if (!raw) {
      return 'Scanning in progress...';
    }
    const normalized = raw.toLowerCase();
    if (normalized === 'queued' || normalized.includes('queue')) {
      return 'Queued: waiting for scanner availability...';
    }
    return raw;
  }

  isProgressSegmentActive(index: number): boolean {
    return index < Math.ceil(this.progress / 5);
  }

  trackByIp(_: number, row: IpRowState): string {
    return row.ip;
  }
}
