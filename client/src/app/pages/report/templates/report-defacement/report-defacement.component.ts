import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { JsonApiViewerComponent } from '../../../../shared/partials/json-api-viewer/json-api-viewer.component';
import { ReportMappingComponent } from '../../../../shared/partials/report-mapping/report-mapping.component';
import { DefacementResultItem } from '../../../../shared/model/results/defacement/defacement.callback.model';
import { ReportHeaderComponent } from '../../../../shared/partials/report-header/report-header.component';
import { ResultSectionComponent } from '../../../../shared/partials/result-components/result-section/result-section.component';
import { ResultListComponent } from '../../../../shared/partials/result-components/result-list/result-list.component';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { formatKeyLabel as formatKeyLabelUtil, formatTitleUrl as formatTitleUrlUtil, isHiddenReportMetadataKey, normalizeDisplayUrl as normalizeDisplayUrlUtil } from '../../../../shared/utils/intel-report.util';
import { ScrollService } from '../../../../shared/services/scroll.service';
import { ReportInteractionHostComponent } from '../../../../shared/partials/report-interactions/report-interaction-host/report-interaction-host.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TakedownActionComponent } from '../../../../shared/partials/takedown-action/takedown-action.component';

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
    TooltipDirective,
    ReportInteractionHostComponent,
    TranslatePipe,
    TakedownActionComponent
  ]
})
export class ReportDefacementComponent implements OnInit, AfterViewInit {
  defacementData: DefacementResultItem | null = null;
  isExpandedMetadata: boolean = true;
  activeTab: string = '';
  content: string = '';
  listItems: any[] = [];
  arrayKeys: string[] = [];

  constructor(private route: ActivatedRoute, private scrollService: ScrollService, private elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data['reportdata']) {
        this.defacementData = data['reportdata'] as DefacementResultItem;
        this.prepareMetadata();
        this.scrollToTop();
      }
    });
  }

  ngAfterViewInit(): void {
    this.scrollToTop();
  }

  private scrollToTop(): void {
    this.scrollService.scrollReportToTop();
    this.elementRef.nativeElement.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  get filteredArrayKeys(): string[] {
    return this.arrayKeys.filter(key => {
      const val = (this.defacementData as any)?.[key];
      return !isHiddenReportMetadataKey(key) && val != null && (!Array.isArray(val) || val.length > 0);
    });
  }

  metadataToggleContent(): void {
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
    return formatKeyLabelUtil(key);
  }

  getMetadataCount(key: string): number {
    if (key === 'm_content') {
      return this.content ? 1 : 0;
    }
    const value = (this.defacementData as any)?.[key];
    return Array.isArray(value) ? value.length : value ? 1 : 0;
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
        if (Array.isArray(value) && value.length > 0 && key !== 'm_section' && !isHiddenReportMetadataKey(key)) {
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
    return formatTitleUrlUtil(url, '-');
  }

  normalizeDisplayUrl(url?: string | string[] | null): string {
    const rawUrl = Array.isArray(url) ? (url[0] || '') : (url || '');
    return normalizeDisplayUrlUtil(rawUrl, '-');
  }

  get reportDocId(): string {
    return (this.defacementData as any)?.m_hash
      || (this.defacementData as any)?._id
      || (this.defacementData as any)?.doc_id
      || (this.defacementData as any)?.m_document_id
      || this.route.snapshot.paramMap.get('m_hash')
      || '';
  }
}
