import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DefacementCallbackModel, DefacementResultItem } from '../../../../../model/results/defacement/defacement.callback.model';
import { TooltipDirective } from '../../../../../directive/tooltip-directive.directive';
import { HelperService } from '../../../../../services/helper.service';
import { StealerLogCallbackModel } from '../../../../../model/results/credentials/credential.callback.model';
import { DashboardService } from '../../../../../../services/dashboard/dashboard.service';

type DefGroup = { type: string; items: DefacementResultItem[] };

@Component({
  selector: 'app-defacement-results',
  imports: [CommonModule, TooltipDirective],
  templateUrl: './threat-results.component.html',
})
export class ThreatResultsComponent implements OnInit, OnChanges {
  @Input() results_defacement!: DefacementCallbackModel | undefined;
  @Input() results_stealerlog!: StealerLogCallbackModel | undefined;
  @Input() isExpandable = false;

  showLimitDefacement = 10;
  showLimitStealer = 10;

  threatTypeCounts: { [key: string]: number } = {};
  groupedDefacement: DefGroup[] = [];

  copiedKey: string | null = null;
  private copiedTimer: any = null;

  constructor(protected helperService: HelperService, private dashboardService: DashboardService) {}

  ngOnInit(): void {
    if (this.results_defacement?.Result?.length) {
      this.updateThreatTypeCounts(this.results_defacement.Result);
      this.buildGroupedDefacement();
    }
    if (this.results_stealerlog?.Result?.length) {
      this.showLimitStealer = 10;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['results_defacement'] && this.results_defacement?.Result?.length) {
      this.updateThreatTypeCounts(this.results_defacement.Result);
      this.showLimitDefacement = 10;
      this.buildGroupedDefacement();
    }
    if (changes['results_stealerlog'] && this.results_stealerlog?.Result?.length) {
      this.showLimitStealer = 10;
    }
    if (changes['results_defacement'] || changes['results_stealerlog'] || changes['isExpandable']) {
      this.copiedKey = null;
      if (this.copiedTimer) clearTimeout(this.copiedTimer);
    }
  }

  updateThreatTypeCounts(results: DefacementResultItem[]) {
    this.threatTypeCounts = {};
    results.forEach(item => {
      const type = item.m_ioc_type?.[0] || 'Unknown';
      this.threatTypeCounts[type] = (this.threatTypeCounts[type] || 0) + 1;
    });
  }

  buildGroupedDefacement() {
    const list = (this.results_defacement?.Result ?? []).slice(0, this.showLimitDefacement);
    const map = new Map<string, DefacementResultItem[]>();
    for (const item of list) {
      const type = item.m_ioc_type?.[0] || 'Unknown';
      const arr = map.get(type);
      if (arr) arr.push(item);
      else map.set(type, [item]);
    }
    this.groupedDefacement = Array.from(map.entries()).map(([type, items]) => ({ type, items }));
  }

  explore(route: string, q: string) {
    let query = this.helperService.extractDomain(q);
    if (query.length > 0) q = `"${query}"`;
    if (route !== 'phishing' && route !== 'hacked') route = 'databases';
    const url = `/dashboard/defacement/${route}?q=${encodeURIComponent(q)}`;
    window.open(url, '_blank');
  }

  exploreStealer(url: string, username: string) {
    const encodedUrl = encodeURIComponent(url || '');
    const encodedUser = encodeURIComponent(username || '');
    const finalUrl = `/dashboard/stealerlogs?domain=${encodedUrl}&user=${encodedUser}`;
    window.open(finalUrl, '_blank');
  }

  toggleResultsBarCollapse(): void {
    this.isExpandable = !this.isExpandable;
  }

  onShowMore(category: 'defacement' | 'stealerlog', event: MouseEvent): void {
    event.stopPropagation();
    if (category === 'defacement') {
      this.showLimitDefacement = Math.min(
        this.showLimitDefacement + 10,
        this.results_defacement?.Result?.length ?? this.showLimitDefacement
      );
      this.buildGroupedDefacement();
    } else {
      this.showLimitStealer = Math.min(
        this.showLimitStealer + 10,
        this.results_stealerlog?.Result?.length ?? this.showLimitStealer
      );
    }
  }

  onFilterTypeClick(type: string, event: MouseEvent): void {
    event.stopPropagation();

    if (type === 'defacement_all') {
      let query = this.helperService.extractDomain(this.dashboardService.consolidatedParamModel.q);
      const url = `/dashboard/defacement/databases?q=${encodeURIComponent(query)}`;
      window.open(url, '_blank');
      return;
    }

    if (type === 'phishing' || type === 'hacked' || type === 'databases' || type === 'scam' || type === 'crack') {
      if (type === 'scam') type = 'database';
      else if (type === 'crack') type = 'hacked';
      let query = this.helperService.extractDomain(this.dashboardService.consolidatedParamModel.q);
      const url = `/dashboard/defacement/${type}?q=${encodeURIComponent(query)}`;
      window.open(url, '_blank');
    } else if (type === 'stealerlog') {
      let query = this.helperService.extractDomain(this.dashboardService.consolidatedParamModel.q);
      const finalUrl = `/dashboard/stealerlogs?url=${encodeURIComponent(query)}&user=${''}`;
      window.open(finalUrl, '_blank');
    }
  }

  isCopied(key: string): boolean {
    return this.copiedKey === key;
  }

  async copyText(text: any, key: string, e?: MouseEvent) {
    if (e) e.stopPropagation();
    const value = text == null ? '' : String(text);
    if (!value || value === '-') return;

    const ok = await this.tryClipboard(value);
    if (!ok) return;

    this.setCopied(key);
  }

  private setCopied(key: string) {
    this.copiedKey = key;
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => (this.copiedKey = null), 1200);
  }

  private async tryClipboard(value: string): Promise<boolean> {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {}

    try {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      ta.setAttribute('readonly', '');
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  webServerValue(item: any): string {
    if (item?.m_web_server?.length) return item.m_web_server.join(', ');
    return '-';
  }

  attackerValue(item: any): string {
    if (item?.m_attacker?.length) return item.m_attacker.join(', ');
    return '-';
  }

  teamValue(item: any): string {
    const v = item?.m_team;
    if (v == null || v === '') return '-';
    return String(v);
  }

  ipValue(item: any): string {
    if (item?.m_ip?.length) return item.m_ip.join(', ');
    return '-';
  }

  urlValue(item: any): string {
    const v = item?.m_url;
    if (v == null || v === '') return '-';
    return String(v);
  }

  dateValue(item: any): string {
    const v = item?.m_leak_date;
    if (v == null || v === '') return '-';
    return String(v);
  }

  usernameValue(item: any): string {
    const v = item?.['username'];
    if (v == null || v === '') return '-';
    return String(v);
  }

  passwordValue(item: any): string {
    const v = item?.['password'];
    if (v == null || v === '') return '-';
    return String(v);
  }

  domainValue(item: any): string {
    const v = item?.['domain'];
    if (v == null || v === '') return '-';
    return String(v);
  }

  hashValue(item: any): string {
    const v = item?.['m_hash'];
    if (v == null || v === '') return '-';
    return String(v);
  }

  stealerUrlValue(item: any): string {
    const v = item?.['url'];
    if (v == null || v === '') return '-';
    return String(v);
  }

  truncate(v: any, n: number = 30): string {
    const s = v == null ? '' : String(v);
    if (!s) return '-';
    return s.length > n ? s.slice(0, n) + '...' : s;
  }
}
