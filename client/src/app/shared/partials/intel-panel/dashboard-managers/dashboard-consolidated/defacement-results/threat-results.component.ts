import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DefacementCallbackModel, DefacementResultItem } from '../../../../../model/results/defacement/defacement.callback.model';
import { TooltipDirective } from '../../../../../directive/tooltip-directive.directive';
import { HelperService } from '../../../../../services/helper.service';
import { StealerLogCallbackModel, StealerLogResultItem } from '../../../../../model/results/credentials/credential.callback.model';
import { DashboardService } from '../../../../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-defacement-results',
  imports: [CommonModule, TooltipDirective],
  templateUrl: './threat-results.component.html',
})
export class ThreatResultsComponent implements OnInit, OnChanges {
  @Input() results_defacement!: DefacementCallbackModel | undefined;
  @Input() results_stealerlog!: StealerLogCallbackModel | undefined;
  @Input() isExpandable = false;

  threatTypeCounts: { [key: string]: number } = {};

  constructor(protected helperService: HelperService, private dashboardService: DashboardService) {
  }

  ngOnInit(): void {
    if (this.results_defacement?.Result?.length) {
      this.updateThreatTypeCounts(this.results_defacement.Result);
    } else if (this.results_stealerlog?.Result?.length) {
      this.updateStealerTypeCounts(this.results_stealerlog.Result);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['results_defacement'] && this.results_defacement?.Result?.length) {
      this.updateThreatTypeCounts(this.results_defacement.Result);
    } else if (changes['results_stealerlog'] && this.results_stealerlog?.Result?.length) {
      this.updateStealerTypeCounts(this.results_stealerlog.Result);
    }
  }

  updateThreatTypeCounts(results: DefacementResultItem[]) {
    this.threatTypeCounts = {};
    results.forEach(item => {
      const type = item.m_ioc_type?.[0] || 'Unknown';
      this.threatTypeCounts[type] = (this.threatTypeCounts[type] || 0) + 1;
    });
  }

  updateStealerTypeCounts(results: StealerLogResultItem[]) {
    this.threatTypeCounts["stealerlog"] = results.length;
  }

  explore(route: string, q: string) {
    let query = this.helperService.extractDomain(q);
    if (query.length > 0) {
      q = `"${query}"`;
    }
    if (route !== "phishing" && route !== "hacked") {
      route = "databases";
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
  onFilterTypeClick(type: string, event: MouseEvent): void {
    event.stopPropagation();
    if (type === "phishing" || type === "hacked" || type === "databases") {
      let query = this.helperService.extractDomain(this.dashboardService.consolidatedParamModel.q);
      const url = `/dashboard/defacement/${type}?q=${encodeURIComponent(query)}`;
      window.open(url, '_blank');
    }
    else if (type === "stealerlog") {
      let query = this.helperService.extractDomain(this.dashboardService.consolidatedParamModel.q);
      const finalUrl = `/dashboard/stealerlogs?url=${encodeURIComponent(query)}&user=${''}`;
      window.open(finalUrl, '_blank');
    }
  }
}
