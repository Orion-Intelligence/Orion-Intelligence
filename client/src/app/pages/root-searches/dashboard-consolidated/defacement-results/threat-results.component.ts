import { Component, OnChanges, OnInit, SimpleChanges, effect, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DefacementCallbackModel, DefacementResultItem } from '../../../../shared/model/results/defacement/defacement.callback.model';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { HelperService } from '../../../../shared/services/helper.service';
import { StealerLogCallbackModel } from '../../../../shared/model/results/credentials/credential.callback.model';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { ResultRowHelperService } from '../../../../shared/services/result-row-helper.service';
import { ProxyController } from '../../../../shared/services/proxy-controller';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-defacement-results',
  imports: [CommonModule, TooltipDirective, TranslatePipe],
  templateUrl: './threat-results.component.html',
})
export class ThreatResultsComponent implements OnInit, OnChanges {
  private readonly proxied_resource = inject(ProxyController);
  private copiedTimer: any = null;

  readonly isExpandableInput = input(false, { alias: 'isExpandable' });
  showLimitDefacement = 10;
  showLimitStealer = 10;
  threatTypeCounts: Record<string, number> = {};
  copiedKey: string | null = null;
  readonly results_defacement = input.required<DefacementCallbackModel | undefined>();
  readonly results_stealerlog = input.required<StealerLogCallbackModel | undefined>();
  isExpandable = false;

  constructor(protected helperService: HelperService, private dashboardService: DashboardService, private rowHelper: ResultRowHelperService) {
    effect(() => {
      this.isExpandable = this.isExpandableInput();
    });
  }

  isLightTheme(): boolean {
    return document.body.classList.contains('light-theme');
  }

  ngOnInit(): void {
    const results_defacement = this.results_defacement();
    if (results_defacement?.Result?.length) {
      this.updateThreatTypeCounts(results_defacement.Result);
    }
    if (this.results_stealerlog()?.Result?.length) {
      this.showLimitStealer = 10;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const results_defacement = this.results_defacement();
    if (changes['results_defacement'] && results_defacement?.Result?.length) {
      this.updateThreatTypeCounts(results_defacement.Result);
      this.showLimitDefacement = 10;
    }
    if (changes['results_stealerlog'] && this.results_stealerlog()?.Result?.length) {
      this.showLimitStealer = 10;
    }
    if (changes['results_defacement'] || changes['results_stealerlog'] || changes['isExpandable']) {
      this.copiedKey = null;
      if (this.copiedTimer) {
        clearTimeout(this.copiedTimer);
      }
    }
  }

  updateThreatTypeCounts(results: DefacementResultItem[]) {
    this.threatTypeCounts = {};
    results.forEach(item => {
      const type = this.normalizeThreatType(item.m_ioc_type?.[0]);
      this.threatTypeCounts[type] = (this.threatTypeCounts[type] || 0) + 1;
    });
  }

  private normalizeThreatType(type: any): string {
    return String(type || 'Unknown').trim().toLowerCase() || 'Unknown';
  }

  explore(route: string, q: string) {
    let query = this.helperService.extractDomain(q);
    if (query.length > 0) {
      q = `"${query}"`;
    }
    if (route !== 'phishing' && route !== 'hacked') {
      route = 'databases';
    }
    const url = `/dashboard/defacement/${route}?q=${encodeURIComponent(q)}`;
    this.proxied_resource.open(url);
  }

  exploreStealer(url: string, username: string) {
    const encodedUrl = encodeURIComponent(url || '');
    const encodedUser = encodeURIComponent(username || '');
    const finalUrl = `/dashboard/stealerlogs?domain=${encodedUrl}&user=${encodedUser}`;
    this.proxied_resource.open(finalUrl);
  }

  toggleResultsBarCollapse(): void {
    this.isExpandable = !this.isExpandable;
  }

  onShowMore(category: 'defacement' | 'stealerlog', event: MouseEvent): void {
    event.stopPropagation();
    if (category === 'defacement') {
      this.showLimitDefacement = Math.min(this.showLimitDefacement + 10, this.results_defacement()?.Result?.length ?? this.showLimitDefacement);
    }
    else {
      this.showLimitStealer = Math.min(this.showLimitStealer + 10, this.results_stealerlog()?.Result?.length ?? this.showLimitStealer);
    }
  }

  onFilterTypeClick(type: string, event: MouseEvent): void {
    event.stopPropagation();
    type = this.normalizeThreatType(type);
    if (type === 'defacement_all') {
      let query = this.helperService.extractDomain(this.dashboardService.consolidatedParamModel.q);
      const url = `/dashboard/defacement/databases?q=${encodeURIComponent(query)}`;
      this.proxied_resource.open(url);
      return;
    }
    if (type === 'phishing' || type === 'hacked' || type === 'databases' || type === 'scam' || type === 'crack') {
      if (type === 'scam') {
        type = 'database';
      }
      else if (type === 'crack') {
        type = 'hacked';
      }
      let query = this.helperService.extractDomain(this.dashboardService.consolidatedParamModel.q);
      const url = `/dashboard/defacement/${type}?q=${encodeURIComponent(query)}`;
      this.proxied_resource.open(url);
    }
    else if (type === 'stealerlog') {
      let query = this.helperService.extractDomain(this.dashboardService.consolidatedParamModel.q);
      const finalUrl = `/dashboard/stealerlogs/iocs?q=${encodeURIComponent(query)}&user=`;
      this.proxied_resource.open(finalUrl);
    }
  }

  isCopied(key: string): boolean {
    return this.rowHelper.isCopied(this.copiedKey, key);
  }

  copyText(text: any, key: string, e?: MouseEvent) {
    this.rowHelper.copyText(text, key, (copiedKey) => {
      this.copiedTimer = this.rowHelper.setCopiedState(copiedKey, this.copiedTimer, (value) => {
        this.copiedKey = value;
      });
    }, e);
  }

  webServerValue(item: any): string {
    return this.rowHelper.arrayOrDash(item?.m_web_server);
  }

  attackerValue(item: any): string {
    return this.rowHelper.arrayOrDash(item?.m_attacker);
  }

  teamValue(item: any): string {
    return this.rowHelper.valueOrDash(item?.m_team);
  }

  ipValue(item: any): string {
    return this.rowHelper.arrayOrDash(item?.m_ip);
  }

  urlValue(item: any): string {
    return this.rowHelper.valueOrDash(item?.m_url);
  }

  dateValue(item: any): string {
    return this.rowHelper.valueOrDash(item?.m_leak_date);
  }

  usernameValue(item: any): string {
    return this.rowHelper.valueOrDash(item?.['username']);
  }

  passwordValue(item: any): string {
    return this.rowHelper.valueOrDash(item?.['password']);
  }

  domainValue(item: any): string {
    return this.rowHelper.valueOrDash(item?.['domain']);
  }

  hashValue(item: any): string {
    return this.rowHelper.valueOrDash(item?.['m_hash']);
  }

  stealerUrlValue(item: any): string {
    return this.rowHelper.valueOrDash(item?.['url']);
  }

  truncate(v: any, n: number = 30): string {
    return this.rowHelper.truncate(v, n);
  }
}
