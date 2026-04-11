import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, of, timer } from 'rxjs';
import { catchError, expand, finalize, switchMap, takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-onion-search-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onion-search-card.component.html',
})
export class OnionSearchCardComponent {
  isExpandable = false;
  isLoading = false;
  progress = 0;
  currentStep = '';
  hasError = false;
  engines: Array<{ engine: string; search_url?: string; first_result?: { url?: string; title?: string; description?: string }; }> = [];

  @Input() query = '';

  constructor(private http: HttpClient) {}

  toggleResultsBarCollapse(): void {
    this.isExpandable = !this.isExpandable;

    // trigger search when opening
    if (this.isExpandable && !this.isLoading && this.engines.length === 0 && !this.hasError) {
      this.onSearch();
    }
  }

  onSearch(): void {
    const q = (this.query || '').trim();
    if (!q) {
      this.hasError = true;
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.progress = 0;
    this.currentStep = '';
    this.engines = [];

    const payload = { text: { query: q } };

    this.fetchSearchResults('/api/cross/search', payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res) => {
          if (!res) {
            this.hasError = true;
            return;
          }

          if (this.isPendingResponse(res)) {
            const p = res?.result?.progress ?? res?.progress;
            if (typeof p === 'number' && !Number.isNaN(p)) {
              this.progress = p;
            }

            const st = res?.result?.step ?? res?.step;
            if (typeof st === 'string' && st) {
              this.currentStep = st;
            }

            return;
          }

          const resultStatus = (res?.result?.status ?? '').toLowerCase();
          if (resultStatus !== 'success') {
            this.hasError = true;
            return;
          }

          const results = Array.isArray(res?.result?.results) ? res.result.results : [];
          this.engines = results
            .filter((r: any) => (r?.status ?? '').toLowerCase() === 'success')
            .map((r: any) => ({
              engine: r.engine,
              search_url: r.search_url,
              first_result: r.first_result,
            }));
        },
        error: () => (this.hasError = true),
      });
  }

  get progressValue(): number {
    const p = Number(this.progress);
    if (!Number.isFinite(p)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(p)));
  }

  private fetchSearchResults(apiEndpoint: string, payload: any): Observable<any> {
    return this.http.post<any>(apiEndpoint, payload).pipe(expand((res) =>
      this.shouldContinuePolling(res)
        ? timer(2000).pipe(switchMap(() => this.http.post<any>(apiEndpoint, payload)))
        : EMPTY),
    takeWhile((res) => this.shouldContinuePolling(res), true),
    catchError(() => of(null)));
  }

  private isPendingResponse(res: any): boolean {
    const topStatus = (res?.status || '').toLowerCase();
    const nestedStatus = (res?.result?.status || '').toLowerCase();
    return (
      ['pending', 'processing', 'running', 'busy'].includes(topStatus) ||
      ['pending', 'processing', 'running', 'busy'].includes(nestedStatus)
    );
  }

  private shouldContinuePolling(res: any): boolean {
    return this.isPendingResponse(res);
  }
}
