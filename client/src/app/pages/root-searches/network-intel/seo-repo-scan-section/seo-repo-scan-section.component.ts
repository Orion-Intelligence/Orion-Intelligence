import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { NetworkIntelScanService } from '../../../../shared/services/network-intel/network-intel-scan.service';
import { UrlScanMeta, UrlScanThreatItem } from '../../../../shared/model/security-scan/security.scan.results.model';

export interface NetworkIntelSeoRepoScanCategory {
  name: string;
  total: number;
  items: UrlScanThreatItem[];
}

@Component({
  selector: 'app-network-intel-seo-repo-scan-section',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './seo-repo-scan-section.component.html',
  animations: [fadeInDashboardItem],
})
export class SeoRepoScanSectionComponent {
  readonly isEmbedded = input(false);
  readonly isScanning = input(false);
  readonly progress = input(0);
  readonly currentStep = input('');
  readonly errorMessage = input<string | null>(null);
  readonly hasSearched = input(false);
  readonly meta = input<UrlScanMeta | null>(null);
  readonly categories = input<NetworkIntelSeoRepoScanCategory[]>([]);
  readonly grade = input('');
  readonly gradeCounts = input({ high: 0, medium: 0, low: 0, informational: 0 });
  readonly scanType = input('');

  constructor(private ui: NetworkIntelScanService) {}

  get progressValue(): number {
    return this.ui.getProgressValue(this.progress());
  }

  get loadingStepLabel(): string {
    return this.ui.getLoadingStepLabel(this.currentStep());
  }

  get showShell(): boolean {
    return this.hasSearched() && (this.isScanning() || !!this.meta() || !!this.errorMessage());
  }

  get totalFindings(): number {
    return this.categories().reduce((total, category) => total + category.items.length, 0);
  }

  get displayHost(): string {
    return this.meta()?.Host || this.extractHost(this.meta()?.URL) || '-';
  }

  get displayPort(): string {
    const port = this.meta()?.Port;
    return port ? port.replace(/\s*SSL/i, '').trim() : '-';
  }

  get tlsStatus(): string {
    const port = this.meta()?.Port || '';
    return /ssl/i.test(port) ? 'Enabled' : 'Not detected';
  }

  get normalizedScanType(): string {
    const value = this.scanType();
    return value === 'repo' ? 'Repository' : value === 'seo' ? 'SEO' : value || '-';
  }

  get summaryEntries(): { label: string; value: string | number; tone?: string }[] {
    const counts = this.gradeCounts();
    return [
      { label: 'Grade', value: this.grade() || '-', tone: this.gradeClass(this.grade()) },
      { label: 'Findings', value: this.totalFindings, tone: 'text-[var(--color-text1)]' },
      { label: 'High', value: counts.high ?? 0, tone: 'text-red-400' },
      { label: 'Medium', value: counts.medium ?? 0, tone: 'text-amber-400' },
      { label: 'Low', value: counts.low ?? 0, tone: 'text-sky-400' },
      { label: 'Info', value: counts.informational ?? 0, tone: 'text-emerald-400' },
    ];
  }

  get detailEntries(): { label: string; value: string }[] {
    const meta = this.meta();
    return [
      { label: 'Target URL', value: meta?.URL || '-' },
      { label: 'Host', value: this.displayHost },
      { label: 'Port', value: this.displayPort },
      { label: 'TLS', value: this.tlsStatus },
      { label: 'Scan Type', value: this.normalizedScanType },
      { label: 'Scanned On', value: meta?.Scanned_on_date || '-' },
    ].filter((entry) => entry.value !== '-');
  }

  riskBadgeClass(risk: string | undefined | null): string {
    const normalized = String(risk || '').toLowerCase();
    if (normalized === 'high' || normalized === 'critical') {
      return 'border-red-400/20 bg-red-500/10 text-red-300';
    }
    if (normalized === 'medium') {
      return 'border-amber-400/20 bg-amber-500/10 text-amber-300';
    }
    if (normalized === 'low') {
      return 'border-sky-400/20 bg-sky-500/10 text-sky-300';
    }
    return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300';
  }

  private gradeClass(grade: string): string {
    const normalized = String(grade || '').toLowerCase();
    if (['a', 'b'].includes(normalized)) {
      return 'text-emerald-400';
    }
    if (normalized === 'c') {
      return 'text-amber-400';
    }
    if (normalized) {
      return 'text-red-400';
    }
    return 'text-[var(--color-text1)]';
  }

  private extractHost(url?: string): string {
    try {
      return url ? new URL(url).hostname : '';
    }
    catch {
      return '';
    }
  }
}
