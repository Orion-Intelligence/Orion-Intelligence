import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgClass, NgForOf, NgIf, NgOptimizedImage } from '@angular/common';
import { DefacementModel, GenericModel, InsightCallbackModel, LeakModel } from '../../../shared/model/homepage/stats_insight.model';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';
import { ScrollService } from '../../../shared/services/scroll.service';
import { LatestDocument, LatestDocumentCallbackModel } from '../../../shared/model/homepage/document_insight.model';
import { AppService } from '../../../services/core/app/app.service';
import { LicenseService } from '../../../services/licenses/licenses.service';
@Component({
  selector: 'app-home-insight',
  templateUrl: './home-insight.component.html',
  imports: [NgForOf, NgIf, NgOptimizedImage, NgClass, TooltipDirective],
  standalone: true
})
export class HomeInsightComponent implements OnInit {
  protected readonly String = String;

  insights!: InsightCallbackModel;
  latestDocuments!: LatestDocumentCallbackModel;
  models: ("general" | "leak" | "defacement")[] = ["general", "leak", "defacement"];
  latestDocumentModelKeys: string[] = [];

  constructor(private router: Router, private route: ActivatedRoute, protected scrollService: ScrollService, public appService: AppService, protected licenseService: LicenseService) {
  }

  ngOnInit() {
    const data = this.route.snapshot.data['insights'];
    this.insights = data.insights;
    this.latestDocuments = data.latestDocument;
    this.latestDocumentModelKeys = (Object.keys(this.latestDocuments) as (keyof LatestDocumentCallbackModel)[]).filter(key => ['leak_model', 'chat_model', 'defacement_model'].includes(key) &&
            this.latestDocuments[key] &&
            this.latestDocuments[key].length > 0);
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
