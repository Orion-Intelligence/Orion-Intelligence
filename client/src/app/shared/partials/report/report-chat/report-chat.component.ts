import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ChatResultItem} from '../../../model/results/chat/chat.callback.model';
import {HelperService} from '../../../services/helper.service';
import {
  NgForOf,
  NgIf,
  NgOptimizedImage,
  TitleCasePipe
} from '@angular/common';
import {ResultListComponent} from '../../result-components/result-list/result-list.component';
import {ResultSectionComponent} from '../../result-components/result-section/result-section.component';
import {fadeInDashboardItem} from '../../../animations/dashboard.item.animation';

@Component({
  selector: 'app-report-chat',
  templateUrl: './report-chat.component.html',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    TitleCasePipe,
    NgOptimizedImage,
    ResultListComponent,
    ResultSectionComponent
  ],
  animations: [fadeInDashboardItem]
})
export class ReportChatComponent implements OnInit {
  resultItem: ChatResultItem | null = null;
  arrayKeys: string[] = [];
  listItems: any[] = [];
  activeTab: string = '';
  content: string = '';
  summary: string = '';

  constructor(
    private route: ActivatedRoute,
    private helper: HelperService
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
      this.summary = this.resultItem.m_summary[0] || '';
      this.arrayKeys = [];

      const addedKeys = new Set<string>();

      if (this.resultItem.m_content?.trim()) {
        this.arrayKeys.push('m_content');
        addedKeys.add('m_content');
      }

      if (this.resultItem.m_summary[0]?.trim()) {
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

  shareResult() {
    this.helper.shareResult(this.resultItem?.m_message_sharable_link ?? '');
  }

  redirectToUrl() {
    if (this.resultItem?.m_weblink?.length) {
      window.open(this.resultItem.m_message_sharable_link, '_blank');
    }
  }
}
