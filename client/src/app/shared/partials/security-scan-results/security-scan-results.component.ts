import {CommonModule} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {finalize} from 'rxjs/operators';
import {ApiService} from '../../services/api.service';
import {fadeInDashboardItem} from '../../animations/dashboard.item.animation';
import {UrlScanMeta, UrlScanResponse, UrlScanThreatItem} from '../../model/security-scan/security.scan.results.model';

@Component({
  selector: 'app-security-scan-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './security-scan-results.component.html',
  styleUrl: './security-scan-results.component.css',
  animations: [fadeInDashboardItem]
})
export class SecurityScanResultsComponent implements OnInit {
  meta: UrlScanMeta | null = null;
  categories: { name: string; total: number; items: UrlScanThreatItem[] }[] = [];
  requestedUrl = '';
  requestedDomain = '';
  isLoading = true;
  hasError = false;
  errorMessage = '';
  skeletonCards = Array.from({ length: 3 });

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const rawParam = this.route.snapshot.queryParamMap.get('domain') || '';
    this.requestedUrl = this.resolveRequestedUrl(rawParam) || window.location.href;
    this.requestedDomain = this.extractHost(this.requestedUrl) || window.location.hostname || 'localhost';
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.meta = null;
    this.categories = [];
    this.api.post<UrlScanResponse>('urlscan/domain', { domain: this.requestedUrl })
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: (res) => {
          const safe = !!(res && res.result && res.result.meta);
          if (!safe) {
            this.hasError = true;
            this.errorMessage = 'No data received from scanner.';
            return;
          }
          const m = res.result.meta;
          this.meta = {
            ...m,
            Host: (m?.Host && m.Host.trim()) || this.extractHost(m?.URL) || this.requestedDomain,
            URL: m?.URL || this.requestedUrl
          };
          this.categories = Object.entries(res.result.threats || {})
            .map(([name, items]) => {
              const seen = new Set<string>();
              const uniqueItems = (items || []).filter(it => {
                const key = (it.header || '').trim().toLowerCase();
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return true;
              });
              return { name, total: (items || []).length, items: uniqueItems };
            })
            .filter(c => c.items.length > 0);
        },
        error: (err) => {
          this.hasError = true;
          this.errorMessage = (err && (err.error?.detail || err.message)) || 'Failed to fetch security scan results.';
        }
      });
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

  private extractHost(url?: string): string {
    try { return url ? new URL(url).hostname : ''; } catch { return ''; }
  }

  get displayHost(): string {
    return this.meta?.Host || this.extractHost(this.meta?.URL) || this.requestedDomain;
  }

  get displayPort(): string {
    if (!this.meta?.Port) return '';
    return this.meta.Port.replace(/\s*SSL/i, '').trim();
  }

  get hasSSL(): boolean {
    return !!this.meta?.Port && /ssl/i.test(this.meta.Port);
  }

  retry(): void {
    this.load();
  }

  trackByCategory = (_: number, c: { name: string }) => c.name;
  trackByItem = (i: number) => i;
}
