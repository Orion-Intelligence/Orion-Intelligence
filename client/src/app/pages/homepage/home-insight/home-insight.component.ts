import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { DefacementModel, GenericModel, LeakModel } from '../../../shared/model/homepage/stats_insight.model';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';
import { LatestDocument, LatestDocumentCallbackModel } from '../../../shared/model/homepage/document_insight.model';
import { AppService } from '../../../services/core/app/app.service';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { InsightCacheService } from '../../../shared/services/insight-cache.service';
@Component({
  selector: 'app-home-insight',
  templateUrl: './home-insight.component.html',
  imports: [NgOptimizedImage, NgClass, TooltipDirective],
  standalone: true,
})
export class HomeInsightComponent implements OnInit {
  protected readonly String = String;

  insights: any = { general: {}, leak: {}, defacement: {} };
  latestDocuments: LatestDocumentCallbackModel = { generic_model: [], leak_model: [], defacement_model: [], chat_model: [], exploit_model: [] };
  models: ("general" | "leak" | "defacement")[] = ["general", "leak", "defacement"];
  latestDocumentModelKeys: string[] = [];
  isLoading = true;
  readonly loadingCards = [1, 2, 3, 4];

  constructor(private router: Router, private route: ActivatedRoute, public appService: AppService, protected licenseService: LicenseService, private insightCacheService: InsightCacheService) {
  }

  ngOnInit() {
    const data = this.route.snapshot.data['insights'];
    if (data) {
      this.applyInsightData(data);
      return;
    }
    this.insightCacheService.getInsight().subscribe(data => { this.applyInsightData(data); });
  }

  private applyInsightData(data: any): void {
    this.insights = data.insights;
    this.latestDocuments = data.latestDocument;
    this.latestDocumentModelKeys = (Object.keys(this.latestDocuments) as (keyof LatestDocumentCallbackModel)[]).filter(key => ['leak_model', 'chat_model', 'defacement_model'].includes(key) &&
            this.latestDocuments[key] &&
            this.latestDocuments[key].length > 0);
    this.isLoading = false;
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

  openReport(modelKey: string, hash: string, title: string) {
    const route = this.getModelRoute(modelKey, hash, title);
    this.router.navigateByUrl(route).then();
  }

  getModelRoute(modelKey: string, hash: string, title: string): string {
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

  trimUrl(url: string, maxLength: number = 24): string {
    if (!url) {
      return '';
    }
    const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '');
    return cleanUrl.length > maxLength ? cleanUrl.slice(0, maxLength) + '...' : cleanUrl;
  }
}
