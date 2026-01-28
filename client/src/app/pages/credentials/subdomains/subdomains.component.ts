import {Component, Input, Output, EventEmitter} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {ApiService} from '../../../shared/services/api.service';
import {EMPTY, timer, interval, Subject} from 'rxjs';
import {expand, switchMap, takeWhile, finalize, takeUntil, tap} from 'rxjs/operators';

interface SubdomainResponse {
  result?: {
    status?: string;
    subdomains?: string[];
    count?: number;
    message?: string;
  };
  status?: string;
  subdomains?: string[];
  count?: number;
  message?: string;
}

@Component({
  selector: 'app-subdomains',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subdomains.component.html',
  styleUrls: ['./subdomains.component.css']
})
export class SubdomainsComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() search = new EventEmitter<string[]>();
  toast = ""

  domain = '';
  loading = false;
  error = '';
  subdomains: string[] = [];
  count = 0;
  progress = 0;
  statusMessage = 'Initializing...';
  isValidDomain = true;
  submitted = false;

  private destroy$ = new Subject<void>();
  private progressTimer$ = new Subject<void>();

  constructor(private api: ApiService) {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.progressTimer$.next();
    this.progressTimer$.complete();
  }

  onClose(): void {
    this.stopProgressSimulation();
    this.submitted = false;
    this.close.emit();
  }

  private resolveRequestedUrl(input: string): string {
    const v = decodeURIComponent(input || '').trim();
    if (!v) return '';
    try {
      const u = new URL(v.match(/^https?:\/\//i) ? v : `https://${v.replace(/^\/+/, '')}`);
      return u.toString();
    } catch {
      return `https://${v.replace(/^https?:\/\//i, '').replace(/^\/+/, '')}`;
    }
  }

  private startProgressSimulation(): void {
    this.progress = 0;
    this.progressTimer$ = new Subject<void>();

    interval(300)
      .pipe(
        takeUntil(this.progressTimer$),
        tap(() => {
          if (this.progress < 90) {
            const increment = this.progress < 30 ? 3 : this.progress < 60 ? 2 : 1;
            this.progress = Math.min(90, this.progress + increment);
          }
        })
      )
      .subscribe();
  }

  private stopProgressSimulation(): void {
    this.progressTimer$.next();
    this.progress = 100;
  }

  private updateStatusMessage(res: SubdomainResponse): void {
    const status = res?.result?.status || res?.status;

    if (status === 'pending') {
      this.statusMessage = 'Scanning for subdomains...';
    } else if (status === 'busy') {
      this.statusMessage = 'Processing request...';
    } else if (status === 'success') {
      const count = res?.result?.count || res?.count || 0;
      this.statusMessage = `Found ${count} subdomain${count !== 1 ? 's' : ''}`;
    } else {
      this.statusMessage = 'Requesting...';
    }
  }

  validateDomain(): void {
    const trimmed = this.domain.trim();

    if (!trimmed) {
      this.isValidDomain = true;
      return;
    }

    const domainOnly = trimmed.replace(/^https?:\/\//i, '').replace(/\/.*/, '');

    const domainRegex =
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;

    this.isValidDomain = domainRegex.test(domainOnly);
  }

  getSubdomainUrl(subdomain: string): string {
    if (subdomain.match(/^https?:\/\//i)) {
      return subdomain;
    }
    return `https://${subdomain}`;
  }

  onSearch(): void {
    this.submitted = true;

    const raw = (this.domain ?? '').trim();
    if (!raw) {
      this.error = 'Please enter a domain';
      return;
    }

    this.validateDomain();
    if (!this.isValidDomain) {
      this.error = 'Please enter a valid domain (e.g., example.com)';
      return;
    }

    const resolved = this.resolveRequestedUrl(raw);

    this.loading = true;
    this.error = '';
    this.subdomains = [];
    this.count = 0;
    this.startProgressSimulation();
    this.statusMessage = 'Initiating scan...';

    this.api
      .post<SubdomainResponse>('urlscan/domain', {
        domain: resolved,
        scanType: 'subdomains'
      })
      .pipe(
        tap((res) => this.updateStatusMessage(res)),
        expand((res: SubdomainResponse) => {
          const status = res?.result?.status || res?.status;

          if (status === 'pending' || status === 'busy') {
            return timer(4000).pipe(
              switchMap(() =>
                this.api
                  .post<SubdomainResponse>('urlscan/domain', {
                    domain: resolved,
                    scanType: 'subdomains'
                  })
                  .pipe(tap((newRes) => this.updateStatusMessage(newRes)))
              )
            );
          }
          return EMPTY;
        }),
        takeWhile(
          (res: SubdomainResponse) => {
            const status = res?.result?.status || res?.status;
            return status === 'pending' || status === 'busy';
          },
          true
        ),
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.stopProgressSimulation();
        })
      )
      .subscribe({
        next: (res: SubdomainResponse) => {
          const status = res?.result?.status || res?.status;

          if (status === 'pending' || status === 'busy') {
            return;
          }

          if (status === 'success') {
            const list = res?.result?.subdomains || res?.subdomains || [];
            const count = res?.result?.count || res?.count || list.length;

            this.subdomains = list;
            this.count = count;
            this.statusMessage = `Found ${count} subdomain${count !== 1 ? 's' : ''}`;
            this.search.emit(list);
            this.progress = 100;
          } else {
            this.error = res?.result?.message || res?.message || 'Failed to fetch subdomains';
            this.statusMessage = 'Scan failed';
          }
        },
        error: (err) => {
          this.loading = false;
          this.stopProgressSimulation();
          this.statusMessage = 'Error occurred';
          this.error =
            err?.status === 401
              ? 'Unauthorized: Please check your credentials'
              : err?.error?.message || 'Failed to fetch subdomains. Please try again.';
        }
      });
  }

  copyOne(value: string): void {
    navigator.clipboard.writeText(value).then();
    this.toast = 'Copied';
    setTimeout(() => (this.toast = ''), 900);
  }

  copyAll(): void {
    navigator.clipboard.writeText(this.subdomains.join(', ')).then();
    this.toast = 'All copied';
    setTimeout(() => (this.toast = ''), 900);
  }

}
