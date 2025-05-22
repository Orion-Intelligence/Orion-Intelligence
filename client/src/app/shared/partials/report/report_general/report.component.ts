import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ResultSectionComponent } from '../../result-components/result-section/result-section.component';
import { ResultListComponent } from '../../result-components/result-list/result-list.component';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { last } from 'rxjs';
import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
import { HelperService } from '../../../services/helper.service';
import { LeakResultItem } from '../../../model/results/leak/leak.callback.model';
import { GeneralResultItem } from '../../../model/results/general/general.callback.model';
import { AppService } from '../../../../services/core/app.service';
import { Category } from '../../../enums/pages';
import { ApiService } from '../../../services/api.service';
import { HttpParams } from '@angular/common/http';
import { TooltipDirective } from '../../../directive/tooltip-directive.directive';

@Component({
  selector: 'app-result-panel', templateUrl: './report.component.html', imports: [ResultListComponent, CommonModule, ResultSectionComponent, NgOptimizedImage, TooltipDirective], animations: [fadeInDashboardItem],
})
export class ReportComponent implements OnInit {
  resultItem: GeneralResultItem | LeakResultItem | null = null;
  arrayKeys: string[] = [];
  listItems: any[] = [];
  activeTab: string = '';
  content: string = '';
  lang = "en"
  lang_detected = "en"
  type = ""
  isImageLoaded: boolean = false;
  isImageError: boolean = false;
  imageSrc: string | null = null;
  aiSuggestStatus: boolean = false
  aiSuggestSummary = ""

  constructor(private api: ApiService, private cdr: ChangeDetectorRef, private route: ActivatedRoute, private helperService: HelperService, appService: AppService) {
    this.lang = appService.getConfig().language_allowed
    this.lang_detected = appService.getConfig().language_allowed
  }

  ngOnInit(): void {
    this.route.data.subscribe(({ reportdata, type }) => {
      this.resultItem = reportdata;
      this.type = type;
      this.processResultItem();

      if (this.resultItem?.m_screenshot) {
        this.loadImage(this.resultItem.m_screenshot);
      }
      let content = this.resultItem?.m_content
      if (content) {
        this.lang_detected = this.helperService.detectLanguageName(content);
      }
    });
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

  get filteredArrayKeys(): string[] {
    return this.arrayKeys.filter(key => {
      const val = (this.resultItem as any)?.[key];
      return val != null && (!Array.isArray(val) || val.length > 0);
    });
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

  downloadCSV() {
    this.helperService.downloadAsCSV(this.resultItem);
  }

  printPage() {
    this.helperService.printPage();
  }

  aiSuggest() {
    const apiUrl = 'nlp/summarize/ai';

    this.api.post<{ result: string }>(apiUrl, {
      data: this.resultItem?.m_content
    }).subscribe({
      next: (response) => {
        this.aiSuggestStatus = true;
        this.aiSuggestSummary = response.result || 'No summary available';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Summarization failed', err);
      }
    });
  }

  langUpdate() {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('lang', this.lang);

    const segments = currentUrl.pathname.split('/').filter(Boolean);
    const type = segments[segments.length - 3];
    const reportId = segments[segments.length - 1];
    const apiUrl = `search/${type}/${reportId}`;

    window.history.pushState({}, '', currentUrl.toString());

    this.api.get<GeneralResultItem | LeakResultItem>(apiUrl, {
      params: new HttpParams().set('lang', this.lang)
    }).subscribe({
      next: (result) => {
        this.resultItem = result;
        this.processResultItem();

        if (this.resultItem?.m_screenshot) {
          this.loadImage(this.resultItem.m_screenshot);
        }

        this.cdr.detectChanges();
      }
    });
  }

  shareResult() {
    this.helperService.shareResult(this.resultItem?.m_url || '');
  }

  redirectToUrl() {
    if (this.resultItem && this.resultItem.m_url) {
      window.open(this.resultItem.m_url, '_blank');
    }
  }

  open_graph() {
    const baseUrl = `${window.location.origin}/dashboard/ctigraph`;
    const parts = window.location.pathname.split('/');
    const singleInput = parts[parts.length - 1];

    const params = new URLSearchParams({
      selectedType: 'document', singleInput: singleInput
    });

    const fullUrl = `${baseUrl}?${params.toString()}`;
    window.open(fullUrl, '_blank');
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

  isWithinDays(dateString: string = '', days: number): boolean {
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

  protected readonly last = last;
  protected readonly Category = Category;
}
