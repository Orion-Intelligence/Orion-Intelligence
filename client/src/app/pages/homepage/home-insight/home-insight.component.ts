import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {NgClass, NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import {DefacementModel, GenericModel, InsightCallbackModel, LeakModel} from '../../../shared/model/homepage/stats_insight.model';
import {TooltipDirective} from '../../../shared/directive/tooltip-directive.directive';
import {ScrollService} from '../../../shared/services/scroll.service';
import {CustomizeBarChartComponent} from "../../../shared/partials/customize-bar-chart/customize-bar-chart.component";
import {GraphModel} from '../../../shared/model/charts/charts.model';
import {GraphInsightCallbackModel} from '../../../shared/model/homepage/graph.insight.model';
import {LatestDocument, LatestDocumentCallbackModel} from '../../../shared/model/homepage/document_insight.model';

@Component({
  selector: 'app-home-insight',
  templateUrl: './home-insight.component.html',
  imports: [NgForOf, NgIf, NgOptimizedImage, NgClass, TooltipDirective, CustomizeBarChartComponent],
  standalone: true
})
export class HomeInsightComponent implements OnInit {
  insights!: InsightCallbackModel;
  latestDocuments!: LatestDocumentCallbackModel;
  graphInsight!: GraphInsightCallbackModel;
  models: ("general" | "leak" | "defacement")[] = ["general", "leak", "defacement"];
  latestDocumentModelKeys: string[] = [];
  GraphData!: GraphModel[];

  constructor(private router: Router, private route: ActivatedRoute, protected scrollService: ScrollService) {
  }

  ngOnInit() {
    const data = this.route.snapshot.data['insights'];
    this.insights = data.insights;
    this.latestDocuments = data.latestDocument;
    this.graphInsight = data.graph_insight;
    this.latestDocumentModelKeys = (Object.keys(this.latestDocuments) as (keyof LatestDocumentCallbackModel)[]).filter(key => this.latestDocuments[key] && this.latestDocuments[key].length > 0);
    this.GraphData = this.transformToGraphDataList(data.graph_insight);
  }

  transformToGraphDataList(insight: [true, any[]] | [false, null]): GraphModel[] {
    if (!Array.isArray(insight) || !insight[0] || !Array.isArray(insight[1])) {
      return [];
    }

    return insight[1].map((agg: any) => {
      return {
        type: 'bar',
        title: agg.aggregation_name,
        data: (agg.buckets || []).map((bucket: any) => ({
          name: bucket.key,
          value: bucket.count,
          target: Math.floor(bucket.count * 0.8)
        }))
      };
    });
  }

  getKeys(obj: GenericModel | LeakModel | DefacementModel): string[] {
    return obj ? Object.keys(obj) : [];
  }

  formatModelKey(key: string): string {
    return key
      .replace('_model', '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  getResultItems(modelKey: string): LatestDocument[] {
    const model = (this.latestDocuments as any)[modelKey];
    return Array.isArray(model) ? model.slice(0, 4) : [];
  }

  openReport(modelKey: string, hash: string, title:string) {
    const route = this.getModelRoute(modelKey, hash, title);
    this.router.navigateByUrl(route).then();
  }

  getModelRoute(modelKey: string, hash: string, title:string): string {
    let model = this.formatModelKey(modelKey).toLowerCase();
    if (model === 'generic') {
      model = 'general';
    }
    const base = this.router.url.split('?')[0];
    const segments = base.split('/');
    segments.pop();
    const newBase = segments.join('/');
    return `${newBase}/consolidated/${model}/${hash}?ci=${model}&q=${title}`;
  }

  protected readonly String = String;

}
