import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgClass, NgForOf, NgIf, NgOptimizedImage } from '@angular/common';
import {
  DefacementModel,
  GenericModel,
  InsightCallbackModel,
  LeakModel
} from '../../../shared/model/homepage/insight.model';
import { LatestDocument, LatestDocumentCallbackModel } from '../../../shared/model/homepage/latestDocument.model';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';
import { ScrollService } from '../../../shared/services/scroll.service';
import { CustomizeBarChartComponent } from "../../../shared/partials/customize-bar-chart/customize-bar-chart.component";
import { GraphModel } from '../../../shared/model/charts/charts.model';

@Component({
  selector: 'app-home-insight',
  templateUrl: './home-insight.component.html',
  imports: [NgForOf, NgIf, NgOptimizedImage, NgClass, TooltipDirective, RouterLink, CustomizeBarChartComponent],
  standalone: true
})
export class HomeInsightComponent implements OnInit {
  insights!: InsightCallbackModel;
  latestDocuments!: LatestDocumentCallbackModel;
  models: ("general" | "leak" | "defacement")[] = ["general", "leak", "defacement"];
  latestDocumentModelKeys: string[] = [];
  GraphData!: GraphModel;

  constructor(private router: Router, private route: ActivatedRoute, protected scrollService: ScrollService) { }

  ngOnInit() {
    const data = this.route.snapshot.data['insights'];
    this.insights = data.insights;
    this.latestDocuments = data.latestDocument;
    this.latestDocumentModelKeys = (Object.keys(this.latestDocuments) as (keyof LatestDocumentCallbackModel)[])
      .filter(key => this.latestDocuments[key] && this.latestDocuments[key].length > 0);
    this.GraphData = {
      type: 'bar',
      title: 'Sample Threat Activity',
      data: [
        { name: 'USA', value: 120, target: 95 },
        { name: 'UK', value: 80, target: 70 },
        { name: 'Germany', value: 60, target: 50 },
        { name: 'India', value: 100, target: 90 },
        { name: 'China', value: 130, target: 110 },
      ]
    };
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
  getQueryParams(modelKey: string): any {
    let model = this.formatModelKey(modelKey).toLowerCase();
    if (model === 'generic')
      model = 'general'
    return {
      ci: model || 'general'
    };
  }

  getModelRoute(modelKey: string): string {
    let model = this.formatModelKey(modelKey).toLowerCase();
    if (model === 'generic')
      model = 'general'
    const base = this.router.url.split('?')[0];
    const segments = base.split('/');
    segments.pop();
    const newBase = segments.join('/');
    return `${newBase}/consolidated/${model}`;

  }
  protected readonly String = String;

}
