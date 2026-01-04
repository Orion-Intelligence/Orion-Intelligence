import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DefacementCallbackModel, DefacementResultItem } from '../../../../../model/results/defacement/defacement.callback.model';
import { TooltipDirective } from '../../../../../directive/tooltip-directive.directive';
import { HelperService } from '../../../../../services/helper.service';
import { StealerLogCallbackModel, StealerLogResultItem } from '../../../../../model/results/credentials/credential.callback.model';
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
    if (query.length > 0) {
      q = `"${query}"`;
    }
    if (route !== 'phishing' && route !== 'hacked') {
      route = 'databases';
    }
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
}
