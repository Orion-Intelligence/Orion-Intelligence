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
  standalone: true,
  styles: [`
    :host-context(.light-theme) .ui-home-insight-metric-card {
      background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%) !important;
      border-color: #cdd9e8 !important;
      color: #334e68 !important;
      box-shadow: 0 2px 6px rgb(15 23 42 / 6%) !important;
    }

    :host-context(.light-theme) .ui-home-insight-metric-card:hover {
      box-shadow: 0 4px 10px rgb(15 23 42 / 8%) !important;
    }

    :host-context(.light-theme) .ui-home-insight-metric-card .min-w-0 > div {
      color: #2f465f !important;
    }

    :host-context(.light-theme) .ui-home-insight-metric-card .ml-auto > div {
      color: #3f5872 !important;
    }

    :host-context(.light-theme) .ui-home-insight-metric-card .text-\\[var\\(--color-text1\\)\\] {
      color: #2f465f !important;
    }

    :host-context(.light-theme) .ui-home-insight-metric-card .opacity-50 {
      color: #6f86a0 !important;
      opacity: .85 !important;
    }

    :host-context(.light-theme) .ui-home-insight-stat-icon {
      filter: brightness(0) saturate(100%) invert(26%) sepia(18%) saturate(817%) hue-rotate(174deg) brightness(91%) contrast(90%);
      opacity: .9;
    }
  `]
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
