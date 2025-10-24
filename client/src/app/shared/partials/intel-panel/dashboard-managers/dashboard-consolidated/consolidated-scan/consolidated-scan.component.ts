import { Component } from '@angular/core';
import { NgIf, NgClass, AsyncPipe } from '@angular/common';
import { ConsolidatedApiService } from '../../../../../services/consolidated.api.service';
import { ConsolidatedScanResults } from '../../../../../model/results/consolidated/consolidated.callback.model';
import { finalize, Observable, of } from 'rxjs';

@Component({
  selector: 'app-consolidated-scan',
  imports: [NgIf, NgClass, AsyncPipe],
  templateUrl: './consolidated-scan.component.html'
})
export class ConsolidatedScanComponent {
  query: string = '';
  scanResult$: Observable<ConsolidatedScanResults | null> = of(null);
  isProcessing: boolean = false;
  isExpanded: boolean = false;
  showComponent: boolean = false;

  constructor(private liveApiService: ConsolidatedApiService) { }

  public runScan(newQuery: string): void {
    this.query = newQuery;
    const domain = this.validateAndExtractDomain(newQuery);
    if (!domain) {
      this.showComponent = false;
      return;
    }
    this.isExpanded = false;
    this.showComponent = true;
    this.initAndScan();
  }

  private validateAndExtractDomain(q: string): string {
    const trimmed = q.trim();
    if (trimmed && !/\s/.test(trimmed) && trimmed.includes('.') && !trimmed.includes('/')) {
      return trimmed;
    }
    return '';
  }

  initAndScan(): void {
    const domain = this.validateAndExtractDomain(this.query);
    this.scanResult$ = of(null);

    if (!domain) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    this.liveApiService.scanDomain(domain)
      .pipe(
        finalize(() => {
          this.isProcessing = false;
        })
      )
      .subscribe({
        next: (result) => {
          this.scanResult$ = of(result);
          this.isExpanded = true;
        },
        error: (err) => {
          console.error("Domain Scan failed:", err);
          this.isProcessing = false;
        }
      });
  }

  extractHost(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  getGradeClass(grade: string): string {
    if (['D', 'F'].includes(grade)) return 'scan_report-section-danger';
    if (grade === 'C') return 'scan_report-section-warning';
    return '';
  }
  toggleCollapse(): void {
    if (!this.isProcessing) {
      this.isExpanded = !this.isExpanded;
    }
  }
}
