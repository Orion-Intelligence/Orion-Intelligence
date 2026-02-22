import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { AppService } from '../../../../services/core/app/app.service';
import { JsonApiViewerComponent } from '../../json-api-viewer/json-api-viewer.component';
import { ReportMappingComponent } from '../../report-mapping/report-mapping.component';
import { DefacementResultItem } from '../../../model/results/defacement/defacement.callback.model';
import { ReportHeaderComponent } from '../../report-header/report-header.component';
import { ResultSectionComponent } from '../../result-components/result-section/result-section.component';
import { ResultListComponent } from '../../result-components/result-list/result-list.component';
import { TooltipDirective } from '../../../directive/tooltip-directive.directive';
@Component({
  selector: 'app-report-defacement',
  templateUrl: './report-defacement.component.html',
  imports: [
    CommonModule,
    DatePipe,
    JsonApiViewerComponent,
    ReportMappingComponent,
    ReportHeaderComponent,
    ResultSectionComponent,
    ResultListComponent,
    NgClass,
    TooltipDirective
  ]
})
export class ReportDefacementComponent implements OnInit {
  defacementData: DefacementResultItem | null = null;
  lang = 'en';
  isExpandedMetadata = true;
  activeTab = '';
  content = '';
  listItems: any[] = [];
  arrayKeys: string[] = [];

  constructor(private route: ActivatedRoute, private appService: AppService) {
    this.lang = this.appService.getConfig().appSettings.language_allowed;
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data['reportdata']) {
        this.defacementData = data['reportdata'] as DefacementResultItem;
        this.prepareMetadata();
      }
    });
  }

  get filteredArrayKeys(): string[] {
    return this.arrayKeys.filter(key => {
      const val = (this.defacementData as any)?.[key];
      return val != null && (!Array.isArray(val) || val.length > 0);
    });
  }

  metaadataToggleContent(): void {
    this.isExpandedMetadata = !this.isExpandedMetadata;
  }

  setActiveTab(tab: string): void {
    if (this.activeTab === tab) {
      this.activeTab = '';
      this.listItems = [];
      return;
    }
    this.activeTab = tab;
    if (this.defacementData && Array.isArray((this.defacementData as any)[tab])) {
      this.listItems = (this.defacementData as any)[tab];
    }
    else {
      this.listItems = [];
    }
  }

  formatKeyLabel(key: string): string {
    const cleaned = key.replace(/^m_/, '').replace(/[^a-zA-Z0-9]/g, ' ');
    return cleaned.length < 4
      ? cleaned.toUpperCase()
      : cleaned.toLowerCase().replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1));
  }

  private prepareMetadata(): void {
    this.content = this.defacementData?.m_content || '';
    this.arrayKeys = [];
    if (Array.isArray((this.defacementData as any)?.m_section) && (this.defacementData as any).m_section.length > 0) {
      this.arrayKeys.push('m_section');
    }
    if (this.defacementData?.m_content && this.defacementData.m_content.trim() !== '') {
      this.arrayKeys.push('m_content');
    }
    if (this.defacementData) {
      Object.keys(this.defacementData).forEach(key => {
        const value = (this.defacementData as any)[key];
        if (Array.isArray(value) && value.length > 0 && key !== 'm_section') {
          this.arrayKeys.push(key);
        }
      });
    }
    const keys = this.filteredArrayKeys;
    if (keys.length > 0) {
      this.setActiveTab(keys[0]);
    }
  }

  formatTitleUrl(url?: string | null): string {
    if (!url) {
      return '-';
    }
    try {
      const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      const parsed = new URL(normalized);
      return parsed.hostname.replace(/^www\./i, '') || '-';
    }
    catch {
      return url
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('/')[0]
        .split('?')[0]
        .split('#')[0] || '-';
    }
  }

  normalizeDisplayUrl(url?: string | string[] | null): string {
    const rawUrl = Array.isArray(url) ? (url[0] || '') : (url || '');
    if (!rawUrl) {
      return '-';
    }
    const trimmed = rawUrl.trim();
    if (!trimmed) {
      return '-';
    }
    try {
      const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      const parsed = new URL(normalized);
      const host = parsed.hostname.replace(/^www\./i, '');
      const path = parsed.pathname.replace(/\/+$/, '');
      return `${host}${path}` || host || '-';
    }
    catch {
      return trimmed
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('?')[0]
        .split('#')[0]
        .replace(/\/+$/, '') || '-';
    }
  }
}
