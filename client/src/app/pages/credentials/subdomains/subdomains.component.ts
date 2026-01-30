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
    live_subdomains?: string[];
    count?: number;
    live_count?: number;
    message?: string;
  };
  status?: string;
  subdomains?: string[];
  live_subdomains?: string[];
  count?: number;
  live_count?: number;
  message?: string;
}

interface DnsRecord {
  ip: string;
  hostname: string;
  ping: boolean | null;
  error?: string;
}

interface DnsResponse {
  status: 'idle' | 'pending' | 'busy' | 'done' | 'error';
  progress?: number;
  step?: string;
  result?: DnsRecord;
  error?: string;
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

  activeTab: 'subdomains' | 'dns' = 'subdomains';

  domain = '';
  isValidDomain = true;
  submitted = false;
  toast = '';

  loading = false;
  error = '';
  subdomains: string[] = [];
  count = 0;
  progress = 0;
  statusMessage = 'Initializing...';
  checkLive = false;

  dnsLoading = false;
  dnsError = '';
  dnsRecords: DnsRecord[] = [];
  dnsProgress = 0;
  dnsStatusMessage = 'Initializing...';
  dnsSubmitted = false;

  private destroy$ = new Subject<void>();
  private progressTimer$ = new Subject<void>();
  private dnsProgressTimer$ = new Subject<void>();

  constructor(private api: ApiService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.progressTimer$.next();
    this.progressTimer$.complete();
    this.dnsProgressTimer$.next();
    this.dnsProgressTimer$.complete();
  }

  switchTab(tab: 'subdomains' | 'dns'): void {
    this.activeTab = tab;
  }

  onEnterKey(): void {
    if (this.activeTab === 'subdomains') {
      this.submitted = true;
      this.onSearch();
    } else {
      this.dnsSubmitted = true;
      this.onDnsCheck();
    }
  }

  onClose(): void {
    this.stopProgressSimulation();
    this.stopDnsProgressSimulation();
    this.resetState();
    this.close.emit();
  }

  resetState(): void {
    this.domain = '';
    this.isValidDomain = true;
    this.submitted = false;
    this.toast = '';

    this.loading = false;
    this.error = '';
    this.subdomains = [];
    this.count = 0;
    this.progress = 0;
    this.statusMessage = 'Initializing...';
    this.checkLive = false;

    this.dnsLoading = false;
    this.dnsError = '';
    this.dnsRecords = [];
    this.dnsProgress = 0;
    this.dnsStatusMessage = 'Initializing...';
    this.dnsSubmitted = false;

    this.activeTab = 'subdomains';
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

  private startDnsProgressSimulation(): void {
    this.dnsProgress = 0;
    this.dnsProgressTimer$ = new Subject<void>();

    interval(300)
      .pipe(
        takeUntil(this.dnsProgressTimer$),
        tap(() => {
          if (this.dnsProgress < 90) {
            const increment = this.dnsProgress < 30 ? 3 : this.dnsProgress < 60 ? 2 : 1;
            this.dnsProgress = Math.min(90, this.dnsProgress + increment);
          }
        })
      )
      .subscribe();
  }

  private stopDnsProgressSimulation(): void {
    this.dnsProgressTimer$.next();
    this.dnsProgress = 100;
  }

  private updateStatusMessage(res: SubdomainResponse): void {
    const status = res?.result?.status || res?.status;

    if (status === 'pending') {
      this.statusMessage = this.checkLive ? 'Checking live subdomains...' : 'Scanning for subdomains...';
    } else if (status === 'busy') {
      this.statusMessage = 'Processing request...';
    } else if (status === 'success') {
      const count = res?.result?.count || res?.count || 0;
      const liveCount = res?.result?.live_count || res?.live_count || 0;

      if (this.checkLive) {
        this.statusMessage = `Found ${liveCount} live subdomain${liveCount !== 1 ? 's' : ''}`;
      } else {
        this.statusMessage = `Found ${count} subdomain${count !== 1 ? 's' : ''}`;
      }
    } else {
      this.statusMessage = 'Requesting...';
    }
  }

private updateDnsStatusMessage(res: DnsResponse): void {
  const status = res?.status;

  if (status === 'pending') {
    this.dnsStatusMessage = 'Resolving DNS records...';
  } else if (status === 'busy') {
    this.dnsStatusMessage = 'Processing DNS resolution...';
  } else if (status === 'done') {
    const result = res.result;
    if (result) {
      if (result.hostname) {
        this.dnsStatusMessage = result.ping
          ? `Reachable • ${result.hostname}`
          : `Not reachable • ${result.hostname}`;
      } else {
        this.dnsStatusMessage = result.ping
          ? 'Reachable • No PTR record'
          : 'Not reachable • No PTR record';
      }
    }
  } else if (status === 'error') {
    this.dnsStatusMessage = 'Failed to resolve';
  } else {
    this.dnsStatusMessage = 'Requesting...';
  }
}

  validateDomain(): void {
    const trimmed = this.domain.trim();

    if (!trimmed) {
      this.isValidDomain = true;
      return;
    }

    if (this.activeTab === 'dns') {
      this.validateIp();
    } else {
      const domainOnly = trimmed.replace(/^https?:\/\//i, '').replace(/\/.*/, '');
      const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
      this.isValidDomain = domainRegex.test(domainOnly);
    }
  }

  validateIp(): void {
    const ip = this.domain.trim();

    if (!ip) {
      this.isValidDomain = true;
      return;
    }

    const ipv4 = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;

    const ipv6 = /^((?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::1|::|(?:[0-9a-fA-F]{1,4}:){1,7}:)$/;

    this.isValidDomain = ipv4.test(ip) || ipv6.test(ip);
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
        scanType: 'subdomains',
        checkLive: this.checkLive
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
                    scanType: 'subdomains',
                    checkLive: this.checkLive
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
            if (this.checkLive) {
              const liveList = res?.result?.live_subdomains || res?.live_subdomains || [];
              this.subdomains = liveList;
              this.count = liveList.length;
              this.statusMessage = `Found ${this.count} live subdomain${this.count !== 1 ? 's' : ''}`;
            } else {
              const list = res?.result?.subdomains || res?.subdomains || [];
              this.subdomains = list;
              this.count = list.length;
              this.statusMessage = `Found ${this.count} subdomain${this.count !== 1 ? 's' : ''}`;
            }

            this.search.emit(this.subdomains);
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

onDnsCheck(): void {
  this.dnsSubmitted = true;
  this.dnsError = '';

  const ip = this.domain?.trim();
  if (!ip) {
    this.dnsError = 'Please enter an IP address';
    return;
  }

  this.validateIp();
  if (!this.isValidDomain) {
    this.dnsError = 'Invalid IP address format';
    return;
  }

  this.dnsLoading = true;
  this.dnsRecords = [];
  this.dnsProgress = 0;
  this.dnsStatusMessage = 'Queued...';
  this.startDnsProgressSimulation();

  const record: DnsRecord = { ip, hostname: '', ping: null };
  this.dnsRecords = [record];

  this.api
    .post<DnsResponse>('urlscan/ip', { ip })
    .pipe(
      expand((res: DnsResponse) => {
        const status = res.status;

        if (status === 'pending' || status === 'busy') {
          return timer(4000).pipe(
            switchMap(() => this.api.post<DnsResponse>('urlscan/ip', { ip }))
          );
        }
        return EMPTY;
      }),

      takeWhile((res: DnsResponse) => {
        return res.status === 'pending' || res.status === 'busy';
      }, true),

      takeUntil(this.destroy$),

      finalize(() => {
        this.dnsLoading = false;
        this.stopDnsProgressSimulation();
      })
    )
    .subscribe({
      next: (res: DnsResponse) => {
        if (res.progress != null) {
          this.dnsProgress = res.progress;
        }

        if (res.step) {
          this.dnsStatusMessage = {
            'queued': 'Queued...',
            'hostname_lookup': 'Performing reverse DNS lookup...',
            'ping_check': 'Checking reachability (ping)...',
            'done': 'Finished',
            'error': 'Error occurred'
          }[res.step] || `Processing (${res.step})`;
        }

        if (res.status === 'done' && res.result) {
          this.dnsRecords = [res.result];
          this.dnsProgress = 100;

          this.updateDnsStatusMessage(res);
        }
        else if (res.status === 'error') {
          this.dnsError = res.error || 'Resolution failed';
          this.dnsStatusMessage = 'Failed';
          this.dnsProgress = 100;
        }
      },

      error: (err) => {
        this.dnsLoading = false;
        this.stopDnsProgressSimulation();
        this.dnsStatusMessage = 'Connection error';
        this.dnsError = err?.error?.message || 'Failed to contact server';
        this.dnsProgress = 100;
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

  copyDnsRecord(record: DnsRecord): void {
  const text = `${record.ip}: ${record.hostname || 'No PTR record'} (Ping: ${record.ping ? 'Reachable' : 'Not reachable'})`;
  navigator.clipboard.writeText(text).then();
  this.toast = 'DNS record copied';
  setTimeout(() => (this.toast = ''), 900);
}

copyAllDns(): void {
  const allRecords = this.dnsRecords
    .map(r => `${r.ip}: ${r.hostname || 'No PTR record'} (Ping: ${r.ping ? 'Reachable' : 'Not reachable'})`)
    .join('\n');
  navigator.clipboard.writeText(allRecords).then();
  this.toast = 'All DNS records copied';
  setTimeout(() => (this.toast = ''), 900);
}

}
