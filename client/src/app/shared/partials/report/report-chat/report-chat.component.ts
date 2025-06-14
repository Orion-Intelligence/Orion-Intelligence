import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ChatResultItem} from '../../../model/results/chat/chat.callback.model';
import {HelperService} from '../../../services/helper.service';
import {CommonModule, NgForOf, NgIf, NgOptimizedImage, SlicePipe,} from '@angular/common';
import {ResultListComponent} from '../../result-components/result-list/result-list.component';
import {ResultSectionComponent} from '../../result-components/result-section/result-section.component';
import {fadeInDashboardItem} from '../../../animations/dashboard.item.animation';
import {TooltipDirective} from '../../../directive/tooltip-directive.directive';
import {JsonApiViewerComponent} from '../../json-api-viewer/json-api-viewer.component';
import {ApiService} from '../../../services/api.service';
import {last} from 'rxjs';

@Component({
  selector: 'app-report-chat',
  templateUrl: './report-chat.component.html',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    NgOptimizedImage,
    ResultListComponent,
    ResultSectionComponent,
    SlicePipe, CommonModule,
    JsonApiViewerComponent, TooltipDirective
  ],
  animations: [fadeInDashboardItem]
})
export class ReportChatComponent implements OnInit {
  resultItem: ChatResultItem | null = null;
  arrayKeys: string[] = [];
  listItems: any[] = [];
  activeTab = '';
  content = '';
  summary = '';
  aiSuggestStatus = false
  aiSuggestSummary = ""
  protected readonly last = last;

  constructor(
    private helper: HelperService,
    private api: ApiService, private cdr: ChangeDetectorRef, private route: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    this.route.data.subscribe(({reportdata}) => {
      this.resultItem = reportdata;
      this.processResultItem();
    });
  }

  processResultItem() {
    if (this.resultItem) {
      this.content = this.resultItem.m_content || '';
      this.summary = (this.resultItem.m_summary?.[0]) || '';
      this.arrayKeys = [];

      const addedKeys = new Set<string>();

      if (this.resultItem.m_content?.trim()) {
        this.arrayKeys.push('m_content');
        addedKeys.add('m_content');
      }

      if (Array.isArray(this.resultItem.m_summary) && this.resultItem.m_summary[0]?.trim()) {
        this.arrayKeys.push('m_summary');
        addedKeys.add('m_summary');
      }

      Object.keys(this.resultItem).forEach((key) => {
        const value = (this.resultItem as any)[key];
        if (
          Array.isArray(value) &&
          value.length > 0 &&
          !addedKeys.has(key)
        ) {
          this.arrayKeys.push(key);
          addedKeys.add(key);
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

    if (tab === 'm_content' || tab === 'm_summary') {
      this.listItems = [];
    } else if (this.resultItem && Array.isArray((this.resultItem as any)[tab])) {
      this.listItems = (this.resultItem as any)[tab].slice(0, 3);
    } else {
      this.listItems = [];
    }
  }

  downloadCSV() {
    this.helper.downloadAsCSV(this.resultItem);
  }

  printPage() {
    this.helper.printPage();
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
      }
    );
  }

  formatKeyTitle(key: string): string {
    const cleaned = (key.startsWith('m_') ? key.slice(2) : key).split('_').join(' ');
    return cleaned.toLowerCase().replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1));
  }

  shareResult() {
    this.helper.shareResult(this.resultItem?.m_message_sharable_link ?? '');
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

  redirectToUrl() {
    if (this.resultItem?.m_weblink?.length) {
      window.open(this.resultItem.m_message_sharable_link, '_blank');
    }
  }
}
