import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, concat } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ConsolidatedApiService } from '../services/consolidated.api.service';
import { ConsolidatedScanResults, ConsolidatedLiveApiResults, ConsolidatedLiveApis } from '../../../../shared/model/results/consolidated/consolidated.callback.model';
import { RouterLink } from '@angular/router';
import { scanAnimation } from '../../../../shared/animations/scan.animations';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AppService } from '../../../../services/core/app/app.service';

type ScanKey = 'basic' | 'seo' | 'repo' | 'liveapi';
interface PendingMsg {
    status: 'pending';
    progress?: number;
    step?: string;
}
@Component({
  selector: 'app-consolidated-scan',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './consolidated-scan.component.html',
  animations: [scanAnimation]
})
export class ConsolidatedScanComponent {
  private resultsByType: Partial<Record<Exclude<ScanKey, 'liveapi'>, ConsolidatedScanResults[]>> = {};
  private progressByType: Partial<Record<ScanKey, number>> = {};
  private scanSub?: Subscription;

  today = new Date();
  isProcessing = false;
  isCollapsed = false;
  targetLabel = '';
  expectedTypes: ScanKey[] = [];
  liveApiResults: ConsolidatedLiveApiResults[] = [];
  readonly isLoading = input.required<boolean>();

  constructor(private api: ConsolidatedApiService, private app_service: AppService) { }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  clearResults( options?: { keepTargetLabel?: boolean; keepExpectedTypes?: boolean; } ): void {
    if (this.isProcessing && this.scanSub) {
      this.scanSub.unsubscribe();
      this.scanSub = undefined;
    }
    const keepTargetLabel = options?.keepTargetLabel ?? false;
    const keepExpectedTypes = options?.keepExpectedTypes ?? false;
    this.isProcessing = false;
    this.isCollapsed = false;
    this.resultsByType = {};
    this.progressByType = {};
    this.liveApiResults = [];
    if (!keepExpectedTypes) {
      this.expectedTypes = [];
    }
    if (!keepTargetLabel) {
      this.targetLabel = '';
    }
  }

  runScan(q: string): void {
    const entityCategories = this.app_service.configData().localSettings.entityfilterCategories;
    const input = (q || '').trim();
    const scans: {
          t: ScanKey;
          o: Observable<any>;
      }[] = [];
    const liveApiEntities: ConsolidatedLiveApis[] = [];
    const domainInputs: string[] = [];
    const repoInputs: string[] = [];
    this.today = new Date();
    this.targetLabel = input;
    if (input) {
      const isDomain = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}$/i.test(input);
      const isRepo = input.includes('github');
      if (isRepo) {
        repoInputs.push(input);
      }
      else if (isDomain) {
        domainInputs.push(input);
      }
      liveApiEntities.push(...this.extractLiveApiEntities(input));
    }
    if (entityCategories) {
      const domains = Array.isArray(entityCategories['m_domain']) ? entityCategories['m_domain'] : [];
      const emails = Array.isArray(entityCategories['m_email']) ? entityCategories['m_email'] : [];
      const urls = Array.isArray(entityCategories['m_url']) ? entityCategories['m_url'] : [];
      const software = Array.isArray(entityCategories['m_software']) ? entityCategories['m_software'] : [];
      const companyNames = Array.isArray(entityCategories['m_company_name']) ? entityCategories['m_company_name'] : [];
      const orgs = Array.isArray(entityCategories['m_org']) ? entityCategories['m_org'] : [];
      for (const domain of domains) {
        const value = (domain || '').trim();
        if (value) {
          domainInputs.push(value);
          liveApiEntities.push(...this.extractLiveApiEntities(value));
        }
      }
      for (const email of emails) {
        const value = (email || '').trim();
        if (value) {
          liveApiEntities.push({ type: 'social', q1: value } as ConsolidatedLiveApis);
        }
      }
      for (const url of urls) {
        const value = (url || '').trim();
        if (value.includes('github')) {
          repoInputs.push(value);
        }
        else if (value.includes('play.google.com/store/apps')) {
          liveApiEntities.push({ type: 'cracked', q1: value } as ConsolidatedLiveApis);
        }
      }
      for (const name of software) {
        const value = (name || '').trim();
        if (value) {
          liveApiEntities.push({ type: 'software', q1: value } as ConsolidatedLiveApis);
        }
      }
      for (const company of companyNames) {
        const value = (company || '').trim();
        if (value) {
          liveApiEntities.push({ type: 'social', q1: value } as ConsolidatedLiveApis);
        }
      }
      for (const org of orgs) {
        const value = (org || '').trim();
        if (value) {
          liveApiEntities.push({ type: 'social', q1: value } as ConsolidatedLiveApis);
        }
      }
    }
    for (const repo of repoInputs) {
      scans.push({ t: 'repo', o: this.api.scanForRepo(repo, 'repo') as any });
    }
    for (const domain of domainInputs) {
      scans.push({ t: 'basic', o: this.api.scanDomain(domain, 'basic') as any });
      scans.push({ t: 'seo', o: this.api.scanDomain(domain, 'seo') as any });
    }
    if (liveApiEntities.length) {
      scans.push({ t: 'liveapi', o: this.api.runLiveApiSearch(liveApiEntities) as any });
    }
    if (!scans.length) {
      return;
    }
    this.expectedTypes = [];
    if (repoInputs.length) {
      this.expectedTypes.push('repo');
    }
    if (domainInputs.length) {
      this.expectedTypes.push('basic', 'seo');
    }
    if (liveApiEntities.length) {
      this.expectedTypes.push('liveapi');
    }
    this.resultsByType = {};
    this.progressByType = {};
    this.liveApiResults = [];
    this.isCollapsed = false;
    for (const t of this.expectedTypes) {
      this.progressByType[t] = 0;
    }
    this.isProcessing = true;
    this.scanSub = concat(...scans.map(({ t, o }) =>o.pipe(map(v => ({ t, v })))))
      .pipe(finalize(() => (this.isProcessing = false)))
      .subscribe({
        next: ({ t, v }: { t: ScanKey; v: any }) => {
          if (this.isPending(v)) {
            this.progressByType[t] = this.clamp(Number(v.progress ?? 0), 0, 100);
            return;
          }
          this.progressByType[t] = 100;
          if (t === 'liveapi') {
            this.liveApiResults = Array.isArray(v) ? v : [];
            return;
          }
          const result = {
            ...(v as ConsolidatedScanResults),
            scanType: (v)?.scanType || t
          } as ConsolidatedScanResults;
          const key = t as Exclude<ScanKey, 'liveapi'>;
          this.resultsByType[key] = [...(this.resultsByType[key] || []), result];
        },
        error: () => {
          this.isProcessing = false;
          this.expectedTypes = [];
          this.resultsByType = {};
          this.progressByType = {};
          this.liveApiResults = [];
        }
      });
  }

  private isPending(v: any): v is PendingMsg {
    return !!v && typeof v === 'object' && String(v.status || '').toLowerCase() === 'pending';
  }

  private clamp(n: number, min: number, max: number): number {
    if (!Number.isFinite(n)) {
      return min;
    }
    if (n < min) {
      return min;
    }
    if (n > max) {
      return max;
    }
    return n;
  }

  private extractLiveApiEntities(q: string): ConsolidatedLiveApis[] {
    const trimmed = (q || '').trim();
    if (!trimmed || /\s/.test(trimmed)) {
      return [];
    }
    const entities: ConsolidatedLiveApis[] = [];
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (isEmail) {
      const username = trimmed.split('@')[0];
      entities.push({ type: 'user', q1: username, q2: trimmed } as ConsolidatedLiveApis);
      entities.push({ type: 'social', q1: username } as ConsolidatedLiveApis);
      return entities;
    }
    if (trimmed.includes('play.google.com/store/apps')) {
      entities.push({ type: 'cracked', q1: trimmed } as ConsolidatedLiveApis);
    }
    try {
      const url = new URL(trimmed);
      const hostname = url.hostname.replace('www.', '');
      const name = hostname.split('.')[0];
      if (name) {
        entities.push({ type: 'social', q1: name } as ConsolidatedLiveApis);
      }
    }
    catch {
      let name = trimmed;
      if (name.includes('.')) {
        name = name.split('.')[0];
      }
      if (name) {
        entities.push({ type: 'social', q1: name } as ConsolidatedLiveApis);
      }
    }
    return entities;
  }

  get showUi(): boolean {
    return this.isProcessing || this.domainResults.length > 0 || this.liveApiRows.length > 0;
  }

  get runningTypes(): ScanKey[] {
    return this.expectedTypes.filter(t => {
      if (t === 'liveapi') {
        return (this.progressByType.liveapi ?? 0) < 100;
      }
      return !this.resultsByType[t];
    });
  }

  get completedCount(): number {
    return this.expectedTypes.length - this.runningTypes.length;
  }

  get totalCount(): number {
    return this.expectedTypes.length;
  }

  get mergedProgress(): number {
    if (!this.totalCount) {
      return 0;
    }
    let sum = 0;
    for (const t of this.expectedTypes) {
      sum += Number(this.progressByType[t] ?? 0);
    }
    return Math.round(sum / this.totalCount);
  }

  get domainResults(): ConsolidatedScanResults[] {
    const out: ConsolidatedScanResults[] = [];
    const b = this.resultsByType.basic;
    const s = this.resultsByType.seo;
    const r = this.resultsByType.repo;
    if (b?.length) {
      out.push(...b);
    }
    if (s?.length) {
      out.push(...s);
    }
    if (r?.length) {
      out.push(...r);
    }
    return out;
  }

  get liveApiRows(): {
      platform: string;
      profile: string;
      url: string;
  }[] {
    const rows: {
          platform: string;
          profile: string;
          url: string;
      }[] = [];
    for (const r of this.liveApiResults || []) {
      const input = (r as any)?.input || {};
      const data = (r as any)?.resultData?.cards_data || [];
      for (const item of data) {
        const url = item?.m_url || item?.m_app_url || '';
        if (!url) {
          continue;
        }
        rows.push({
          platform: item?.m_base_url || item?.m_title || input?.type || 'N/A',
          profile: input?.q1 || '',
          url
        });
      }
    }
    return rows;
  }

  gradeBadgeClass(grade?: string): string {
    const g = (grade || '').toUpperCase();
    const baseClass = 'inline-flex items-center justify-center rounded-[999px] border px-[8px] py-[4px] font-[Inter] text-[12px] font-normal leading-[12px] whitespace-nowrap';
    if (g === 'D') {
      return `${baseClass} border-[rgba(248,113,113,0.45)] bg-[rgba(127,29,29,0.42)] text-red-100`;
    }
    if (g === 'C' || g === 'F') {
      return `${baseClass} border-[var(--color-border)] bg-[var(--color-banner)] text-[var(--color-text5)]`;
    }
    return `${baseClass} border-[var(--color-border)] text-[var(--color-text1)]`;
  }

  gradeText(grade?: string): string {
    const g = (grade || '—').toUpperCase();
    return `${g} Grade`;
  }

  truncateText(text:string, maxLength = 20) {
    return text?.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }
}
