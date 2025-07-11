import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgClass, NgForOf, NgIf, NgOptimizedImage } from '@angular/common';
import {
  DefacementModel,
  GenericModel,
  InsightCallbackModel,
  LeakModel
} from '../../../shared/model/homepage/insight.model';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';
import { ConsolidatedParamModel } from '../../../shared/model/results/consolidated/consolidated.param.model';
import { ConsolidatedCallbackModel } from '../../../shared/model/results/consolidated/consolidated.callback.model';
import { ScrollService } from '../../../shared/services/scroll.service';
import { GraphModel } from '../../../shared/model/charts/charts.model';
import { CustomizeBarChartComponent } from "../../../shared/partials/customize-bar-chart/customize-bar-chart.component";

@Component({
  selector: 'app-home-insight',
  templateUrl: './home-insight.component.html',
  imports: [NgForOf, NgIf, NgOptimizedImage, NgClass, TooltipDirective, RouterLink, CustomizeBarChartComponent],
  standalone: true
})
export class HomeInsightComponent implements OnInit {
  public consolidatedParamModel: ConsolidatedParamModel = new ConsolidatedParamModel();
  public consolidatedCallbackModel: ConsolidatedCallbackModel = new ConsolidatedCallbackModel();
  insights!: InsightCallbackModel;
  models: ("general" | "leak" | "defacement")[] = ["general", "leak", "defacement"];
  consolidatedModelKeys: string[] = [];
  queryParams: any = {};


  sourceGraphData!: GraphModel;
  leakeDateGraphData!: GraphModel;
  constructor(private router: Router, private route: ActivatedRoute, protected scrollService: ScrollService) { }

  ngAfterViewInit() {
    this.scrollService.scrollToSavedPosition();
  }
  ngOnInit() {
    const data = this.route.snapshot.data['insights'];
    this.insights = data.insights;
    this.consolidatedCallbackModel = data.consolidated;

    this.consolidatedModelKeys = Object.keys(this.consolidatedCallbackModel).filter(key => {
      const model = (this.consolidatedCallbackModel as any)[key];
      return model?.Result?.length > 0;
    });

    this.route.queryParams.subscribe(params => {
      this.queryParams = { ...params };
    });

    const topSources = this.getTopSources(this.consolidatedCallbackModel);
    this.sourceGraphData = {
      type: 'bar',
      title: 'Top sources',
      data: topSources.map(item => ({
        name: item.source,
        value: item.count,
        target: 0
      }))
    };

    const topLeakedDates = this.getTopLeakDates(this.consolidatedCallbackModel);
    this.leakeDateGraphData = {
      type: 'bar',
      title: 'Top Leaked Dates',
      data: topLeakedDates.map(item => ({
        name: item.date,
        value: item.count,
        target: 0
      }))
    };
  }

  getKeys(obj: GenericModel | LeakModel | DefacementModel): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getDisplayTitle(item: any): string {
    const title = item?.m_title || item?.m_name || item?.m_caption || item?.m_url || 'Untitled';
    return title.length > 20 ? title.slice(0, 15) + ' ...' : title;
  }
  getDisplayDate(item: any): string | null {
    const rawDate = item?.m_update_date || item?.m_date_of_leak || item?.m_message_date || item?.m_leak_date;
    if (!rawDate) return null;
    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return null;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  getLocationSummary(modelKey: string, item: any): string {
    let locations: string[] = [];

    switch (modelKey) {
      case 'defacement_model':
        if (item?.m_location) {
          if (Array.isArray(item.m_location)) {
            locations = item.m_location;
          } else if (typeof item.m_location === 'string') {
            locations = item.m_location.split(',').map((loc: string) => loc.trim()).filter((loc: any) => loc);
          }
        }
        break;
      case 'leak_model':
        if (item?.m_country_name) {
          if (Array.isArray(item.m_country_name)) {
            locations = item.m_location;
          } else if (typeof item.m_country_name === 'string') {
            locations = item.m_country_name.split(',').map((loc: string) => loc.trim()).filter((loc: any) => loc);
          }
        }
        break;

    }

    if (!locations.length) {
      return '-';
    }

    const result = locations.join(', ');
    return result.length > 24 ? result.slice(0, 24) + '...' : result;
  }

  getSource(modelKey: string, item: any): string {
    switch (modelKey) {
      case 'defacement_model':
        if (Array.isArray(item?.m_attacker) && item.m_attacker.length > 0) {
          return item.m_attacker.join(', ');
        }
        if (item?.m_team) {
          return item.m_team;
        }
        break;

      case 'exploit_model':
        if (item?.m_sender_name) {
          return item.m_sender_name;
        }
        if (item?.m_network) {
          return item.m_network;
        }
        break;

      case 'chat_model':
        if (item?.m_sender_name) {
          return item.m_sender_name;
        }
        if (item?.m_channel_name) {
          return item.m_channel_name;
        }
        break;

      case 'leak_model':
        if (item?.m_network) {
          return item.m_network;
        }
        if (item?.m_company_name) {
          return item.m_company_name;
        }
        break;

      case 'generic_model':
        if (item?.m_network) {
          return item.m_network;
        }
        break;
    }

    return '-';
  }
  formatModelKey(key: string): string {
    return key
      .replace('_model', '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  getResultItems(modelKey: string): any[] {
    const model = (this.consolidatedCallbackModel as any)[modelKey];
    return model?.Result.slice(0, 3) ?? [];
  }
  getQueryParams(modelKey: string): any {
    return {
      ...this.queryParams,
      ci: this.formatModelKey(modelKey).toLowerCase() || 'general'
    };
  }

  getModelRoute(modelKey: string): string {
    const base = this.router.url.split('?')[0];
    const segments = base.split('/');
    segments.pop();
    const newBase = segments.join('/');

    return `${newBase}/consolidated/${this.formatModelKey(modelKey).toLowerCase()}`;

  }


  getTopSources(consolidated: ConsolidatedCallbackModel): { source: string, count: number }[] {
    const sourceMap = new Map<string, number>();

    const addSource = (src?: string | string[]) => {
      if (!src) return;

      if (Array.isArray(src)) {
        src.forEach(s => addSource(s));
      } else {
        const key = src.trim().toLowerCase();
        if (!key) return;
        sourceMap.set(key, (sourceMap.get(key) || 0) + 1);
      }
    };

    consolidated.defacement_model?.Result.forEach(item => {
      addSource(item.m_attacker);
      if (!item.m_attacker?.length) addSource(item.m_team);
    });

    consolidated.exploit_model?.Result.forEach(item => {
      addSource(item.m_sender_name);
    });

    consolidated.chat_model?.Result.forEach(item => {
      addSource(item.m_sender_name);
    });

    consolidated.leak_model?.Result.forEach(item => {
      if (!item.m_company_name) addSource(item.m_network);
      else addSource(item.m_company_name);
    });

    consolidated.generic_model?.Result.forEach(item => {
      addSource(item.m_network);
    });

    return Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  getTopLeakDates(consolidated: ConsolidatedCallbackModel): { date: string, count: number }[] {
    const dateMap = new Map<string, number>();

    const extractAndCount = (rawDate?: string | null) => {
      if (!rawDate) return;
      const date = new Date(rawDate);
      if (isNaN(date.getTime())) return;

      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'long' }); // "May", "June"
      const key = `${day} ${month}`;

      dateMap.set(key, (dateMap.get(key) || 0) + 1);
    };

    consolidated.leak_model?.Result.forEach(item => {
      extractAndCount(item.m_update_date);
      extractAndCount(item.m_leak_date);
    });

    consolidated.generic_model?.Result?.forEach(item => {
      extractAndCount(item.m_update_date);
      extractAndCount(item.m_leak_date);
    });

    consolidated.exploit_model?.Result.forEach(item => {
      if ('m_update_date' in item) extractAndCount((item as any).m_update_date);
      extractAndCount(item.m_leak_date);
    });

    consolidated.chat_model?.Result.forEach(item => {
      if ('m_leak_date' in item) extractAndCount((item as any).m_leak_date);
    });

    consolidated.defacement_model?.Result.forEach(item => {
      extractAndCount(item.m_date_of_leak);
    });

    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}
