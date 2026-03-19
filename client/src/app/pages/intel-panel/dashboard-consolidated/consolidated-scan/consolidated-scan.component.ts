import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, concat } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ConsolidatedApiService } from '../../../../shared/services/consolidated.api.service';
import { ConsolidatedScanResults, ConsolidatedLiveApiResults, ConsolidatedLiveApis } from '../../../../shared/model/results/consolidated/consolidated.callback.model';
import { RouterLink } from '@angular/router';
import { scanAnimation } from '../../../../shared/animations/scan.animations';
type ScanKey = 'basic' | 'seo' | 'repo' | 'liveapi';
type PendingMsg = {
    status: 'pending';
    progress?: number;
    step?: string;
};
@Component({
  selector: 'app-consolidated-scan',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './consolidated-scan.component.html',
  animations: [scanAnimation]
})
export class ConsolidatedScanComponent {
  private resultsByType: Partial<Record<Exclude<ScanKey, 'liveapi'>, ConsolidatedScanResults>> = {};
  private progressByType: Partial<Record<ScanKey, number>> = {};
  private liveApiEntities: ConsolidatedLiveApis[] = [];
  private scanSub?: Subscription;

  today = new Date();
  isProcessing = false;
  isCollapsed = false;
  targetLabel = '';
  expectedTypes: ScanKey[] = [];
  liveApiResults: ConsolidatedLiveApiResults[] = [];

  @Input() isLoading!: boolean;

  constructor(private api: ConsolidatedApiService) { }

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
    this.liveApiEntities = [];
    if (!keepExpectedTypes) {
      this.expectedTypes = [];
    }
    if (!keepTargetLabel) {
      this.targetLabel = '';
    }
  }

  runScan(q: string): void {
    const input = (q || '').trim();
    if (!input) {
      return;
    }
    this.today = new Date();
    this.targetLabel = input;
    const isDomain = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}$/i.test(input);
    if (!isDomain) {
      return;
    }
    const isRepo = input.includes('github.com/');
    this.expectedTypes = (isRepo ? ['repo', 'liveapi'] : ['basic', 'seo', 'liveapi']) as ScanKey[];
    this.resultsByType = {};
    this.progressByType = {};
    this.liveApiResults = [];
    this.isCollapsed = false;
    for (const t of this.expectedTypes) {
      this.progressByType[t] = 0;
    }
    this.isProcessing = true;
    this.liveApiEntities = this.extractLiveApiEntities(input);
    const scans: Array<{
          t: ScanKey;
          o: Observable<any>;
      }> = isRepo
        ? [{ t: 'repo', o: this.api.scanForRepo(input, 'repo') as any }]
        : [
          { t: 'basic', o: this.api.scanDomain(input, 'basic') as any },
          { t: 'seo', o: this.api.scanDomain(input, 'seo') as any }
        ];
    if (this.liveApiEntities.length) {
      scans.push({ t: 'liveapi', o: this.api.runLiveApiSearch(this.liveApiEntities) as any });
    }
    else {
      this.progressByType.liveapi = 100;
    }
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
          this.resultsByType[t as Exclude<ScanKey, 'liveapi'>] = {
            ...(v as ConsolidatedScanResults),
            scanType: (v as any)?.scanType || t
          } as ConsolidatedScanResults;
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
      return !this.resultsByType[t as Exclude<ScanKey, 'liveapi'>];
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
    if (b) {
      out.push(b);
    }
    if (s) {
      out.push(s);
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
    return rows.slice(0, 25);
  }

  gradeBadgeClass(grade?: string): string {
    const g = (grade || '').toUpperCase();
    const baseClass = 'inline-flex items-center justify-center rounded-[999px] border border-[var(--color-border)] px-[8px] py-[4px] font-[Inter] text-[12px] font-normal leading-[12px] text-[var(--color-text1)] whitespace-nowrap';
    if (g === 'C' || g === 'D' || g === 'F') {
      return `${baseClass} bg-[var(--color-banner)] text-[var(--color-text5)]`;
    }
    return baseClass;
  }

  gradeText(grade?: string): string {
    const g = (grade || '—').toUpperCase();
    return `${g} Grade`;
  }
}
