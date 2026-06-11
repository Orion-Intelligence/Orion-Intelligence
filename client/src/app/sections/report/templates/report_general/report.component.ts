import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ResultSectionComponent } from '../../../../shared/partials/result-components/result-section/result-section.component';
import { ResultListComponent } from '../../../../shared/partials/result-components/result-list/result-list.component';
import { CommonModule, NgClass } from '@angular/common';
import { last } from 'rxjs';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
import { HelperService } from '../../../../shared/services/helper.service';
import { AppService } from '../../../../services/core/app/app.service';
import { Category } from '../../../../shared/constants/pages';
import { ApiService } from '../../../../shared/services/api.service';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { JsonApiViewerComponent } from '../../../../shared/partials/json-api-viewer/json-api-viewer.component';
import { ReportMappingComponent } from "../../../../shared/partials/report-mapping/report-mapping.component";
import { AuthService } from '../../../../services/authetication/auth.service';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { ReportHeaderComponent } from '../../../../shared/partials/report-header/report-header.component';
import { ChatWidgetComponent } from '../../../../pages/root-searches/ai-workspace/chat-widget/chat-widget.component';
import { CodeBlockComponent } from '../../../../shared/partials/code-block/code-block.component';
import { ReportInteractionHostComponent } from '../../social-interactions/report-interaction-host/report-interaction-host.component';
import { formatKeyLabel as formatKeyLabelUtil, getDisplayTitle as getDisplayTitleUtil, getStatusText as getStatusTextUtil, isWithinDays as isWithinDaysUtil, normalizeDisplayUrl as normalizeDisplayUrlUtil } from '../../../../shared/utils/intel-report.util';
import { ScrollService } from '../../../../shared/services/scroll.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-result-panel',
  templateUrl: './report.component.html',
  imports: [ResultListComponent, CommonModule, NgClass, ResultSectionComponent, TooltipDirective, JsonApiViewerComponent, ReportMappingComponent, ReportHeaderComponent, ChatWidgetComponent, CodeBlockComponent, ReportInteractionHostComponent, TranslatePipe],
  animations: [fadeInDashboardItem],
})
export class ReportComponent implements OnInit, AfterViewInit {
  protected readonly last = last;
  protected readonly Category = Category;

  resultItem: any = null;
  arrayKeys: string[] = [];
  listItems: any[] = [];
  activeTab = '';
  content = '';
  lang = "en";
  lang_detected = "en";
  type = "";
  isImageLoaded = false;
  isImageError = false;
  imageSrc: string | null = null;
  isExpandedScreenshoot = true;
  isExpandedMetadata = true;
  username = signal<string>('');
  role = signal<string>('');
  private readonly metadataExcludedKeys = new Set([
    '_id',
    'id',
    'rank_index',
    'm_embedding',
    'm_title',
    'm_content',
    'm_important_content',
    'm_url',
    'm_source_url',
    'm_base_url',
    'm_hash',
    'm_creation_date',
    'm_update_date',
    'm_updation_date',
    'm_scrap_file',
    'm_scrape_file',
    'creation_date',
    'update_date',
    'updation_date',
    'created_at',
    'updated_at',
    'scrap_file',
    'scrape_file'
  ]);

  constructor(private api: ApiService, private cdr: ChangeDetectorRef, protected dashboardService: DashboardService, private route: ActivatedRoute, private helperService: HelperService, protected appService: AppService, protected authService: AuthService, private scrollService: ScrollService, private elementRef: ElementRef<HTMLElement>) {
    this.lang = appService.getConfig().appSettings.language_allowed;
    this.lang_detected = appService.getConfig().appSettings.language_allowed;
    this.username.set(this.appService.userSessionData().user.username);
    this.role.set(this.appService.userSessionData().user.role);
  }

  get filteredArrayKeys(): string[] {
    return this.arrayKeys.filter(key => {
      if (key === 'm_code_snippet' && 'm_code_snippet' in (this.resultItem)) {
        return false;
      }
      const val = (this.resultItem)?.[key];
      return val != null && (!Array.isArray(val) || val.length > 0);
    });
  }

  ngOnInit(): void {
    this.route.data.subscribe(({ reportdata, type }) => {
      this.resultItem = reportdata;
      this.type = type;
      this.processResultItem();
      const keys = this.filteredArrayKeys;
      if (keys.length > 0) {
        this.setActiveTab(keys[0]);
      }
      if (this.resultItem?.m_screenshot) {
        this.loadImage(this.resultItem.m_screenshot);
      }
      const content = this.resultItem?.m_content;
      if (content) {
        this.lang_detected = this.helperService.detectLanguageName(content);
      }
      this.scrollToTop();
    });
  }

  ngAfterViewInit(): void {
    this.scrollToTop();
  }

  private scrollToTop(): void {
    this.scrollService.scrollReportToTop();
    this.elementRef.nativeElement.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  langUpdate(result: any) {
    this.resultItem = result;
    this.processResultItem();
    this.syncActiveMetadataTab();
    if (this.resultItem?.m_screenshot) {
      this.loadImage(this.resultItem.m_screenshot);
    }
    this.cdr.detectChanges();
  }

  screenshootToggleContent(): void {
    this.isExpandedScreenshoot = !this.isExpandedScreenshoot;
  }

  metaadataToggleContent(): void {
    this.isExpandedMetadata = !this.isExpandedMetadata;
  }

  processResultItem() {
    if (this.resultItem) {
      this.content = this.resultItem.m_content || '';
      this.arrayKeys = [];
      if ('m_section' in this.resultItem && Array.isArray(this.resultItem.m_section) && this.resultItem.m_section.length > 0) {
        this.arrayKeys.push('m_section');
      }
      if (this.resultItem.m_content && this.resultItem.m_content.trim() !== '') {
        this.arrayKeys.push('m_content');
      }
      Object.keys(this.resultItem).forEach((key) => {
        const value = (this.resultItem)[key];
        if (key !== 'm_section' && this.shouldShowMetadataKey(key, value)) {
          this.arrayKeys.push(key);
        }
      });
    }
  }

  private shouldShowMetadataKey(key: string, value: unknown): boolean {
    if (this.metadataExcludedKeys.has(key)) {
      return false;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (value == null || typeof value === 'object') {
      return false;
    }
    return String(value).trim().length > 0;
  }

  private getMetadataListItems(key: string): string[] {
    const value = this.resultItem?.[key];
    if (Array.isArray(value)) {
      return value.map(item => String(item));
    }
    if (value == null) {
      return [];
    }
    return [String(value)];
  }

  getMetadataCount(key: string): number {
    if (key === 'm_content') {
      return this.content ? 1 : 0;
    }
    return this.getMetadataListItems(key).length;
  }

  private syncActiveMetadataTab(): void {
    const keys = this.filteredArrayKeys;
    if (!keys.length) {
      this.activeTab = '';
      this.listItems = [];
      return;
    }
    if (!this.activeTab || !keys.includes(this.activeTab)) {
      this.activeTab = keys[0];
    }
    if (this.activeTab === 'm_content') {
      this.listItems = [];
      return;
    }
    this.listItems = this.getMetadataListItems(this.activeTab);
  }

  setActiveTab(tab: string) {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    this.listItems = this.getMetadataListItems(tab);
    this.cdr.detectChanges();
  }

  getStatusText(dateString?: string): string {
    return getStatusTextUtil(dateString);
  }

  isWithinDays(dateString = '', days: number): boolean {
    return isWithinDaysUtil(dateString, days);
  }

  onImageLoad() {
    this.isImageLoaded = true;
  }

  onImageError() {
    this.isImageError = true;
  }

  loadImage(fileName: string) {
    const endpoint = `search/breach/screenshot/${fileName}`;
    this.api.get<Blob>(endpoint, {
      responseType: 'blob'
    } as any).subscribe({
      next: (blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          this.imageSrc = reader.result as string;
          this.isImageError = false;
          this.isImageLoaded = true;
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(blob);
      }, error: () => {
        this.isImageError = true;
        this.imageSrc = null;
        this.cdr.detectChanges();
      }
    });
  }

  formatKeyLabel(key: string): string {
    return formatKeyLabelUtil(key);
  }

  getDisplayTitle(rawTitle?: string | null, fallbackUrl?: string | null): string {
    return getDisplayTitleUtil(rawTitle, fallbackUrl, 'Title not available');
  }

  normalizeDisplayUrl(url?: string | null): string {
    return normalizeDisplayUrlUtil(url, '-');
  }

  getReportUrl(): string {
    return this.resultItem?.m_url || this.resultItem?.m_source_url || this.resultItem?.m_base_url || '';
  }

  getReportDescription(): string {
    return this.resultItem?.m_important_content || this.resultItem?.m_content || '';
  }

  getReportDate(): string {
    return this.resultItem?.m_leak_date || this.resultItem?.m_published_date || this.resultItem?.m_first_seen || '';
  }

  getStatusDate(): string {
    return this.resultItem?.m_creation_date || this.resultItem?.m_update_date || this.getReportDate();
  }

  get reportDocId(): string {
    return this.resultItem?.m_hash || this.resultItem?._id || '';
  }
}
