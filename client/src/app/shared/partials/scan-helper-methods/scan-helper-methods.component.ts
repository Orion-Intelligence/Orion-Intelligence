import { Component, OnDestroy, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription, Subject } from 'rxjs';
import { DnsRecord, WaybackSnapshot } from '../../model/scanners/scanner.models';
import { ScanHelperMethodsService } from './scan-helper-methods-service.service';
import { AppService } from '../../../services/core/app/app.service';
@Component({
  selector: 'app-scan-helper',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scan-helper-methods.component.html'
})
export class ScanHelperMethods implements OnDestroy {
  private destroy$ = new Subject<void>();
  private subs: Subscription[] = [];

  activeTab: 'subdomains' | 'dns' | 'wayback' = 'subdomains';
  domain = '';
  isValidDomain = true;
  toast = '';
  isLoading = false;
  errorMessage = '';
  progress = 0;
  statusMessage = 'Initializing...';
  subdomains: string[] = [];
  subdomainCount = 0;
  checkLive = false;
  dnsRecords: DnsRecord[] = [];
  waybackSnapshots: WaybackSnapshot[] = [];
  cancelRequested = false;
  showInvalid = false;
  readonly isOpen = input(false);
  readonly close = output<undefined>();
  readonly search = output<string[]>();

  get isLightTheme(): boolean {
    return this.appService.userSessionData()?.user?.theme === 'light-theme';
  }

  constructor(private scanService: ScanHelperMethodsService, private appService: AppService) {
    effect(() => {
      this.progress = this.scanService.progress();
    });
    effect(() => {
      const res = this.scanService.onDone();
      if (!res) {
        return;
      }
      if (this.cancelRequested) {
        this.isLoading = false;
        this.statusMessage = 'Cancelled by user';
        this.progress = 0;
        this.cancelRequested = false;
        return;
      }
      const status = res?.status || res?.result?.status || 'unknown';
      const progressVal = res?.progress ?? null;
      if (progressVal != null && typeof progressVal === 'number') {
        this.progress = Math.min(99, progressVal);
      }
      if (status === 'pending') {
        this.statusMessage = res?.step === 'queued'
          ? 'Queued...'
          : res?.step
            ? `Processing (${res.step})`
            : 'Pending...';
        return;
      }
      this.isLoading = false;
      if (this.activeTab === 'subdomains') {
        if (status === 'success') {
          if (this.checkLive) {
            this.subdomains = res?.result?.live_subdomains || res?.live_subdomains || [];
            this.subdomainCount = this.subdomains.length;
          }
          else {
            this.subdomains = res?.result?.subdomains || res?.subdomains || [];
            this.subdomainCount = this.subdomains.length;
          }
          this.search.emit(this.subdomains);
          this.statusMessage = this.subdomainCount > 0
            ? (this.checkLive ? `Found ${this.subdomainCount} live subdomains` : `Found ${this.subdomainCount} subdomains`)
            : 'No records found';
        }
        else {
          this.statusMessage = 'No records found';
        }
      }
      else if (this.activeTab === 'dns') {
        if (res.result.hostname) {
          this.dnsRecords = [res.result];
          this.statusMessage = `Resolved: ${res.result.hostname}`;
        }
        else if (res.status === 'error') {
          this.errorMessage = res.error || 'Resolution failed';
          this.statusMessage = 'Failed';
        }
        else {
          this.statusMessage = 'No records found';
        }
      }
      else if (this.activeTab === 'wayback') {
        if (status === 'success') {
          this.waybackSnapshots = res?.result?.snapshots || res?.snapshots || [];
          this.statusMessage = this.waybackSnapshots.length > 0
            ? `Found ${this.waybackSnapshots.length} snapshot${this.waybackSnapshots.length !== 1 ? 's' : ''}`
            : 'No records found';
        }
        else {
          this.statusMessage = 'No records found';
        }
      }
    });
    effect(() => {
      const err = this.scanService.onError();
      if (!err) {
        return;
      }
      this.isLoading = false;
      if (this.cancelRequested || err?.message === 'Cancelled by user') {
        this.statusMessage = 'Cancelled by user';
        this.progress = 0;
        this.cancelRequested = false;
      }
      else {
        this.statusMessage = 'No records found';
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => {
      s.unsubscribe();
    });
    this.scanService.cancelCurrentScan?.();
    this.destroy$.next();
    this.destroy$.complete();
  }

  switchTab(tab: 'subdomains' | 'dns' | 'wayback'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.showInvalid = false;
    this.statusMessage = "";
  }

  onEnterKey(): void {
    if (this.domain.trim() && !this.isLoading) {
      this.startScan();
    }
  }

  onClose(): void {
    this.resetState();
    // TODO: The 'emit' function requires a mandatory void argument
    this.close.emit(undefined);
  }

  cancelScan(): void {
    if (!this.isLoading) {
      return;
    }
    this.cancelRequested = true;
    this.isLoading = false;
    this.progress = 0;
    this.statusMessage = 'Cancelled by user';
    this.scanService.cancelCurrentScan?.();
  }

  private resetState(): void {
    this.domain = '';
    this.isValidDomain = true;
    this.toast = '';
    this.isLoading = false;
    this.errorMessage = '';
    this.progress = 0;
    this.statusMessage = 'Initializing...';
    this.subdomains = [];
    this.subdomainCount = 0;
    this.dnsRecords = [];
    this.waybackSnapshots = [];
    this.activeTab = 'subdomains';
    this.cancelRequested = false;
    this.showInvalid = false;
  }

  validateDomain(): void {
    const trimmed = this.domain.trim();
    if (!trimmed) {
      this.isValidDomain = true;
      return;
    }
    if (this.activeTab === 'dns') {
      const ip = trimmed;
      const ipv4 = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
      const ipv6 = /^((?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::1|::|(?:[0-9a-fA-F]{1,4}:){1,7}:)$/;
      this.isValidDomain = ipv4.test(ip) || ipv6.test(ip);
    }
    else {
      const domainOnly = trimmed.replace(/^https?:\/\//i, '').replace(/\/.*/, '');
      const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
      this.isValidDomain = domainRegex.test(domainOnly);
    }
  }

  get progressWidthValue(): number {
    const progress = Number(this.progress);
    return Number.isFinite(progress) ? Math.max(0, Math.min(100, Math.round(progress))) : 0;
  }

  getSubdomainUrl(subdomain: string): string {
    return subdomain.match(/^https?:\/\//i) ? subdomain : `https://${subdomain}`;
  }

  getAllWaybackUrls(): string {
    return this.waybackSnapshots.map(s => s.url).join('\n');
  }

  copy(text: string, message: string = 'Copied'): void {
    navigator.clipboard.writeText(text).then(() => {
      this.toast = message;
      setTimeout(() => {
        this.toast = '';
      }, 900);
    }).catch(() => {
      this.toast = 'Failed to copy';
      setTimeout(() => {
        this.toast = '';
      }, 1500);
    });
  }

  startScan(): void {
    this.showInvalid = true;
    this.errorMessage = '';
    this.statusMessage = 'Initializing...';
    this.subdomains = [];
    this.subdomainCount = 0;
    this.dnsRecords = [];
    this.waybackSnapshots = [];
    const input = this.domain.trim();
    if (!input) {
      this.errorMessage = this.activeTab === 'dns' ? 'Please enter an IP address' : 'Please enter a domain';
      return;
    }
    this.validateDomain();
    if (!this.isValidDomain) {
      this.errorMessage = this.activeTab === 'dns' ? 'Invalid IP address format' : 'Please enter a valid domain (e.g., example.com)';
      return;
    }
    const resolved = this.resolveRequestedUrl(input);
    this.isLoading = true;
    this.cancelRequested = false;
    this.statusMessage = this.activeTab === 'dns' ? 'Queued...' : 'Initiating scan...';
    if (this.activeTab === 'subdomains') {
      this.subs.push(this.scanService.scanSubdomains(resolved, this.checkLive));
    }
    else if (this.activeTab === 'dns') {
      this.subs.push(this.scanService.scanDns(input));
    }
    else if (this.activeTab === 'wayback') {
      this.subs.push(this.scanService.scanWayback(resolved));
    }
  }

  private resolveRequestedUrl(input: string): string {
    const v = decodeURIComponent(input || '').trim();
    if (!v) {
      return '';
    }
    try {
      const u = new URL(v.match(/^https?:\/\//i) ? v : `https://${v.replace(/^\/+/, '')}`);
      return u.toString();
    }
    catch {
      return `https://${v.replace(/^https?:\/\//i, '').replace(/^\/+/, '')}`;
    }
  }
}
