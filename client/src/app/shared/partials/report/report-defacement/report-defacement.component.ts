import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
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
import { formatKeyLabel as formatKeyLabelUtil, formatTitleUrl as formatTitleUrlUtil, normalizeDisplayUrl as normalizeDisplayUrlUtil } from '../../../utils/intel-report.util';
import { ScrollService } from '../../../services/scroll.service';
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
export class ReportDefacementComponent implements OnInit, AfterViewInit {
  defacementData: DefacementResultItem | null = null;
  lang = 'en';
  isExpandedMetadata = true;
  activeTab = '';
  content = '';
  listItems: any[] = [];
  arrayKeys: string[] = [];

  constructor(private route: ActivatedRoute, private appService: AppService, private scrollService: ScrollService, private elementRef: ElementRef<HTMLElement>) {
    this.lang = this.appService.getConfig().appSettings.language_allowed;
  }

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
    return formatKeyLabelUtil(key);
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
    return formatTitleUrlUtil(url, '-');
  }

  normalizeDisplayUrl(url?: string | string[] | null): string {
    const rawUrl = Array.isArray(url) ? (url[0] || '') : (url || '');
    return normalizeDisplayUrlUtil(rawUrl, '-');
  }
}
