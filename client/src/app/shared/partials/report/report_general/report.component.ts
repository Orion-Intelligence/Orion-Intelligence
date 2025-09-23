import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ResultSectionComponent} from '../../result-components/result-section/result-section.component';
import {ResultListComponent} from '../../result-components/result-list/result-list.component';
import {CommonModule} from '@angular/common';
import {last, Observable} from 'rxjs';
import {fadeInDashboardItem} from '../../../animations/dashboard.item.animation';
import {HelperService} from '../../../services/helper.service';
import {AppService} from '../../../../services/core/app/app.service';
import {Category} from '../../../constants/pages';
import {ApiService} from '../../../services/api.service';
import {TooltipDirective} from '../../../directive/tooltip-directive.directive';
import {NgbCollapseModule} from '@ng-bootstrap/ng-bootstrap';
import {JsonApiViewerComponent} from '../../json-api-viewer/json-api-viewer.component';
import {ReportMappingComponent} from "../../report-mapping/report-mapping.component";
import {AuthService} from '../../../../services/authetication/auth.service';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';
import {ReportHeaderComponent} from '../../report-header/report-header.component';
import {ChatWidgetComponent} from '../../chat-widget/chat-widget.component';
import {CodeBlockComponent} from '../../code-block/code-block.component';

@Component({
  selector: 'app-result-panel',
  templateUrl: './report.component.html',
  imports: [ResultListComponent, CommonModule, ResultSectionComponent, TooltipDirective, NgbCollapseModule, JsonApiViewerComponent, ReportMappingComponent, ReportHeaderComponent, ReportHeaderComponent, ChatWidgetComponent, CodeBlockComponent],
  animations: [fadeInDashboardItem],
})
export class ReportComponent implements OnInit {
  resultItem: any = null;
  arrayKeys: string[] = [];
  listItems: any[] = [];
  activeTab = '';
  content = '';
  lang = "en"
  lang_detected = "en"
  type = ""
  isImageLoaded = false;
  isImageError = false;
  imageSrc: string | null = null;
  isExpandedScreenshoot = true;
  isExpandedMetadata = true
  protected readonly last = last;
  protected readonly Category = Category;
  username$!: Observable<string | null>;
  role$!: Observable<string | null>;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef, protected dashboardService: DashboardService, private route: ActivatedRoute, private helperService: HelperService,protected appService: AppService, protected authService: AuthService) {
    this.lang = appService.getConfig().appSettings.language_allowed
    this.lang_detected = appService.getConfig().appSettings.language_allowed
    this.username$ = this.authService.getUsername$();
    this.role$ = this.authService.getRole$();
  }

  get filteredArrayKeys(): string[] {
    return this.arrayKeys.filter(key => {
      if (key === 'm_code_snippet' && 'm_code_snippet' in (this.resultItem as any)) {
        return false;
      }

      const val = (this.resultItem as any)?.[key];
      return val != null && (!Array.isArray(val) || val.length > 0);
    });
  }

  ngOnInit(): void {
    this.route.data.subscribe(({reportdata, type}) => {
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
      const content = this.resultItem?.m_content
      if (content) {
        this.lang_detected = this.helperService.detectLanguageName(content);
      }
    });
  }

  langUpdate(result:any) {
    this.resultItem = result;
    this.processResultItem();

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
        const value = (this.resultItem as any)[key];
        if (Array.isArray(value) && value.length > 0 && key !== 'm_section') {
          this.arrayKeys.push(key);
        }
      });
    }
  }

  setActiveTab(tab: string) {
    if (this.activeTab === tab) {
      this.activeTab = '';
      this.listItems = [];
      return;
    }
    this.activeTab = tab;
    if (this.resultItem && Array.isArray((this.resultItem as any)[tab])) {
      this.listItems = (this.resultItem as any)[tab];
    } else {
      this.listItems = [];
    }
    this.cdr.detectChanges();
  }

  getStatusText(dateString?: string): string {
    if (!dateString) return 'Inactive';
    const createdDate = new Date(dateString);
    const today = new Date();
    const diffInDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays <= 5) {
      return 'Active';
    } else if (diffInDays <= 10) {
      return 'Idle';
    } else {
      return 'Inactive';
    }
  }

  isWithinDays(dateString = '', days: number): boolean {
    if (!dateString) return false;
    const createdDate = new Date(dateString);
    const today = new Date();
    const diffInDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= days;
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
    const cleaned = key.replace(/^m_/, '').replace(/[^a-zA-Z0-9]/g, ' ');
    return cleaned.length < 4 ? cleaned.toUpperCase() : cleaned.toLowerCase().replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1));
  }
}
