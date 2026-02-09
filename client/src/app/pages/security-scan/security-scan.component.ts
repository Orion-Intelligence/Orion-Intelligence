// src/app/security-scan/security-scan.component.ts
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { fadeInDashboardItem } from '../../shared/animations/dashboard.item.animation';
import { CodeBlockComponent } from '../../shared/partials/code-block/code-block.component';
import { TooltipDirective } from '../../shared/directive/tooltip-directive.directive';
import { SecurityScanExportComponentComponent } from './security-scan-export-component/security-scan-export-component.component';
import { NgxPrintDirective, NgxPrintModule } from 'ngx-print';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EmptyQueryComponent } from '../../shared/partials/empty-query/empty-query.component';
import {
  UrlScanMeta,
  UrlScanThreatItem,
} from '../../shared/model/security-scan/security.scan.results.model';
import {ScannerService} from './scanner-service.service';


@Component({
  selector: 'app-security-scan',
  standalone: true,
  imports: [
    CommonModule,
    CodeBlockComponent,
    NgxPrintModule,
    NgOptimizedImage,
    TooltipDirective,
    SecurityScanExportComponentComponent,
    NgxPrintDirective,
    FormsModule,
    ReactiveFormsModule,
    EmptyQueryComponent,
  ],
  templateUrl: './security-scan.component.html',
  styleUrl: './security-scan.component.css',
  animations: [fadeInDashboardItem],
})
export class SecurityScanComponent implements OnInit {
  meta: UrlScanMeta | null = null;
  categories: { name: string; total: number; items: UrlScanThreatItem[] }[] = [];
  requestedUrl = '';
  searchQuery: any = '';
  requestedDomain = '';
  isLoading = false;
  isFetched = false;
  hasError = false;
  errorMessage = '';
  skeletonCards = Array.from({ length: 3 });
  progress = signal(0);
  currentStep = '';
  scanType: string = '';
  grade = '';
  gradeCounts: { high: number; medium: number; low: number; informational: number } = {
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
  };

  constructor(private router: Router, private route: ActivatedRoute, private scanner: ScannerService) {}

  ngOnInit(): void {
    this.scanType = this.route.snapshot.data['type'];
    if (!this.scanType) {
      this.scanType = 'basic';
    }

    const rawParam = this.route.snapshot.queryParamMap.get('domain') || '';
    this.searchQuery = rawParam;
    if (!rawParam) {
      return;
    }

    const resolved = this.resolveRequestedUrl(rawParam);
    try {
      const u = new URL(resolved);
      const host = u.hostname;
      const isIPv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
      const validHost = host === 'localhost' || isIPv4 || host.includes('.');
      if (!validHost) {
        return;
      }
      this.requestedUrl = u.toString();
      this.requestedDomain = this.extractHost(this.requestedUrl) || window.location.hostname || 'localhost';
      if (this.scanner.first_load){
        this.load()
      }
      this.scanner.first_load = false;
    } catch {
    }
  }

  private load(): void {
    this.isLoading = true;
    this.isFetched = false;
    this.hasError = false;
    this.errorMessage = '';
    this.meta = null;
    this.categories = [];
    this.progress.set(0);
    this.currentStep = '';
    this.grade = '';
    this.gradeCounts = { high: 0, medium: 0, low: 0, informational: 0 };

    this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: { domain: this.requestedUrl, scanType: this.scanType },
        queryParamsHandling: 'merge',
      })
      .then();

    this.scanner
      .scanDomain(this.requestedUrl, this.scanType)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res: any) => {
          if (res?.result?.status === 'busy' || res?.result?.status === 'pending' || res?.status === 'pending') {
            const p = res?.result?.progress ?? res?.progress;
            if (typeof p === 'number' && !Number.isNaN(p)) this.progress.set(p);
            const st = res?.result?.step ?? res?.step;
            if (typeof st === 'string' && st) this.currentStep = st;
            return;
          }

          this.isFetched = true;

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
            URL: m?.URL || this.requestedUrl,
          };

          this.grade = res.result.grade || '';
          this.gradeCounts = res.result.grade_counts || { high: 0, medium: 0, low: 0, informational: 0 };

          const proofMap = new Map<string, string>();
          const proofs = res.result.proofs || {};
          Object.entries(proofs).forEach(([cat, items]) => {
            (items as any[] || []).forEach((p: any) => {
              const k = cat + '|' + (p.header || '').trim().toLowerCase();
              if (p.proof && !proofMap.has(k)) proofMap.set(k, p.proof);
            });
          });

          const entries = Object.entries(res.result.threats || {}) as [string, any][];
          this.categories = entries
            .map(([name, items]) => {
              const list: any[] = Array.isArray(items) ? items : [];
              const seen = new Set<string>();
              const uniqueItems = list
                .filter((it) => {
                  const key = (it.header || '').trim().toLowerCase();
                  if (!key || seen.has(key)) return false;
                  seen.add(key);
                  return true;
                })
                .map((it) => {
                  const key = (it.header || '').trim().toLowerCase();
                  const mergedProof = proofMap.get(name + '|' + key);
                  return mergedProof ? { ...it, proof: mergedProof } : it;
                });
              return { name, total: list.length, items: uniqueItems as UrlScanThreatItem[] };
            })
            .filter((c) => c.items.length > 0);
        },
        error: (err) => {
          this.isFetched = true;
          this.hasError = true;
          this.errorMessage =
            (err && (err.error?.detail || err.message)) || 'Failed to fetch security scan results.';
        },
      });
  }

  exportReport(): void {
    const payload = {
      meta: this.meta,
      grade: this.grade,
      grade_counts: this.gradeCounts,
      threats: Object.fromEntries(this.categories.map((c) => [c.name, c.items])),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const host = this.displayHost?.replace(/[^a-z0-9.-]/gi, '_') || 'report';
    const dt = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = URL.createObjectURL(blob);
    a.download = `security-scan-${host}-${dt}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
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
    try {
      return url ? new URL(url).hostname : '';
    } catch {
      return '';
    }
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

  onSearchSubmit(): void {
    const raw = (this.searchQuery ?? '').trim();
    if (!raw) return;

    const domain = this.resolveRequestedUrl(raw);

    this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: { domain, scanType: this.scanType },
        queryParamsHandling: 'merge',
      })
      .then(() => {
        this.requestedUrl = domain;
        this.requestedDomain = this.extractHost(domain) || this.requestedDomain;
        this.load();
      });
  }
}
