import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatResultItem } from '../../../model/results/chat/chat.callback.model';
import { HelperService } from '../../../services/helper.service';
import {
  CommonModule,
  NgForOf,
  NgIf,
  NgOptimizedImage, SlicePipe,
  TitleCasePipe
} from '@angular/common';
import { ResultListComponent } from '../../result-components/result-list/result-list.component';
import { ResultSectionComponent } from '../../result-components/result-section/result-section.component';
import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
import { TooltipDirective } from '../../../directive/tooltip-directive.directive';
import { JsonViewerComponent } from "../json-viewer/json-viewer.component";

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
    JsonViewerComponent
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
  isExpanded = false;

  constructor(
    private route: ActivatedRoute,
    private helper: HelperService
  ) {
  }

  ngOnInit(): void {
    this.route.data.subscribe(({ reportdata }) => {
      this.resultItem = reportdata;
      this.processResultItem();
    });
  }
  toggleContent(): void {
    this.isExpanded = !this.isExpanded;
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

  formatKeyTitle(key: string): string {
    const cleaned = (key.startsWith('m_') ? key.slice(2) : key).split('_').join(' ');
    return cleaned.toLowerCase().replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1));
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
