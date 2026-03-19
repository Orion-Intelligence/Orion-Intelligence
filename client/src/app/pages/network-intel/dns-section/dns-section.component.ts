import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { DnsResult, IpRowState } from '../../../shared/model/network-intel/network-intel.model';
import { IpDetailComponent } from '../ip-detail/ip-detail.component';

@Component({
  selector: 'app-network-intel-dns-section',
  standalone: true,
  imports: [CommonModule, IpDetailComponent],
  templateUrl: './dns-section.component.html',
  animations: [fadeInDashboardItem],
})
export class DnsSectionComponent {
  readonly pageSize = 500;
  currentPage = 1;

  @Input() isScanning = false;
  @Input() progress = 0;
  @Input() currentStep = '';
  @Input() progressSegments: number[] = [];
  @Input() errorMessage: string | null = null;
  @Input() hasSearched = false;
  @Input() dnsResult: DnsResult | null = null;
  @Input() ipRows: IpRowState[] = [];
  @Input() resultLabel = 'IP ADDRESS';

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

  get showLoadingSkeleton(): boolean {
    return this.hasSearched && !this.dnsResult && !this.errorMessage && (this.isScanning || this.progress > 0);
  }

  get showNoResults(): boolean {
    return this.hasSearched && !this.isScanning && !this.errorMessage && !!this.dnsResult && this.ipRows.length === 0;
  }

  isProgressSegmentActive(index: number): boolean {
    return index < Math.ceil(this.progress / 5);
  }

  trackByIp(_: number, row: IpRowState): string {
    return row.ip;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ipRows']) {
      const totalPages = this.totalPages;
      this.currentPage = Math.min(this.currentPage, totalPages);
      if (!changes['ipRows'].previousValue || changes['ipRows'].previousValue !== changes['ipRows'].currentValue) {
        this.currentPage = 1;
      }
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.ipRows.length / this.pageSize));
  }

  get pagedRows(): IpRowState[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.ipRows.slice(start, start + this.pageSize);
  }

  get currentPageStart(): number {
    return this.ipRows.length ? ((this.currentPage - 1) * this.pageSize) + 1 : 0;
  }

  get currentPageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.ipRows.length);
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }
}
