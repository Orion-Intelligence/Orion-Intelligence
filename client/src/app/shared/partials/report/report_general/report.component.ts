import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ResultSectionComponent} from '../../result-components/result-section/result-section.component';
import {ResultListComponent} from '../../result-components/result-list/result-list.component';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {last} from 'rxjs';
import {fadeInDashboardItem} from '../../../animations/dashboard.item.animation';
import {HelperService} from '../../../services/helper.service';
import {LeakResultItem} from '../../../model/results/leak/leak.callback.model';
import {GeneralResultItem} from '../../../model/results/general/general.callback.model';
import {AppService} from '../../../../services/core/app.service';
import {Category} from '../../../enums/pages';
import {ApiService} from '../../../services/api.service';

@Component({
  selector: 'app-result-panel',
  templateUrl: './report.component.html',
  imports: [ResultListComponent, CommonModule, ResultSectionComponent, NgOptimizedImage],
  animations: [fadeInDashboardItem],
})
export class ReportComponent implements OnInit {
  resultItem: GeneralResultItem | LeakResultItem | null = null;
  arrayKeys: string[] = [];
  listItems: any[] = [];
  activeTab: string = '';
  content: string = '';
  lang = "en"
  type = ""
  isImageLoaded: boolean = false;
  isImageError: boolean = false;
  imageSrc: string | null = null;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef, private route: ActivatedRoute, private resultHelperService: HelperService, appService: AppService) {
    this.lang = appService.getConfig().language_allowed
  }

  ngOnInit(): void {
    this.route.data.subscribe(({reportdata, type}) => {
      this.resultItem = reportdata;
      this.type = type;
      this.processResultItem();

      if (this.resultItem?.m_screenshot) {
        this.loadImage(this.resultItem.m_screenshot);
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
    this.resultHelperService.downloadAsCSV(this.resultItem);
  }

  printPage() {
    this.resultHelperService.printPage();
  }

  langUpdate() {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('lang', this.lang);
    window.location.href = currentUrl.toString();
  }

  shareResult() {
    this.resultHelperService.shareResult(this.resultItem?.m_url || '');
  }

  redirectToUrl() {
    if (this.resultItem && this.resultItem.m_url) {
      window.open(this.resultItem.m_url, '_blank');
    }
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
    const endpoint = `search/leak/screenshot/${fileName}`;

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

  protected readonly last = last;
  protected readonly Category = Category;
}
