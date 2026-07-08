import { CommonModule } from '@angular/common';
import { Component, SimpleChanges, effect, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
import { DnsResult, IpRowState } from '../../../../shared/model/network-intel/network-intel.model';
import { IpDetailComponent } from '../ip-detail/ip-detail.component';
import { NetworkIntelScanService } from '../../../../shared/services/network-intel/network-intel-scan.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-network-intel-dns-section',
  standalone: true,
  imports: [CommonModule, IpDetailComponent, TranslatePipe],
  templateUrl: './dns-section.component.html',
  animations: [fadeInDashboardItem],
})
export class DnsSectionComponent {
  readonly errorMessageInput = input<string | null>(null, { alias: 'errorMessage' });
  readonly ipRowsInput = input<IpRowState[]>([], { alias: 'ipRows' });
  readonly pageSize = 500;
  currentPage = 1;
  readonly isScanning = input(false);
  readonly progress = input(0);
  readonly currentStep = input('');
  readonly progressSegments = input<number[]>([]);
  errorMessage: string | null = null;
  readonly hasSearched = input(false);
  readonly dnsResult = input<DnsResult | null>(null);
  ipRows: IpRowState[] = [];
  readonly resultLabel = input('IP ADDRESS');
  readonly toggleRow = output<IpRowState>();

  constructor(private router: Router, private ui: NetworkIntelScanService) {
    effect(() => {
      this.errorMessage = this.errorMessageInput();
      this.ipRows = this.ipRowsInput();
    });
  }

  get isEmbeddedInConsolidated(): boolean {
    return this.ui.isEmbeddedInConsolidated(this.router.url);
  }

  get progressValue(): number {
    return this.ui.getProgressValue(this.progress());
  }

  get loadingStepLabel(): string {
    return this.ui.getLoadingStepLabel(this.currentStep());
  }

  get showLoadingSkeleton(): boolean {
    return this.ui.shouldShowLoadingSkeleton(this.hasSearched(), this.dnsResult(), this.errorMessage, this.isScanning(), this.progress());
  }

  get showNoResults(): boolean {
    return this.hasSearched() && !this.isScanning() && !this.errorMessage && !!this.dnsResult() && this.ipRows.length === 0;
  }

  isProgressSegmentActive(index: number): boolean {
    return index < Math.ceil(this.progress() / 5);
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
