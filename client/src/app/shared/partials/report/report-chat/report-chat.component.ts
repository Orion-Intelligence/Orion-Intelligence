import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatResultItem } from '../../../model/results/chat/chat.callback.model';
import { CommonModule, NgForOf, NgIf, SlicePipe, } from '@angular/common';
import { ResultListComponent } from '../../result-components/result-list/result-list.component';
import { ResultSectionComponent } from '../../result-components/result-section/result-section.component';
import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
import { TooltipDirective } from '../../../directive/tooltip-directive.directive';
import { JsonApiViewerComponent } from '../../json-api-viewer/json-api-viewer.component';
import { last, Observable } from 'rxjs';
import { AuthService } from '../../../../services/authetication/auth.service';
import {SocialResultItem} from '../../../model/results/social/social.callback.model';
import {ReportHeaderComponent} from '../../report-header/report-header.component';

@Component({
  selector: 'app-report-chat',
  templateUrl: './report-chat.component.html',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    ResultListComponent,
    ResultSectionComponent,
    SlicePipe, CommonModule,
    JsonApiViewerComponent, TooltipDirective, ReportHeaderComponent
  ],
  animations: [fadeInDashboardItem]
})
export class ReportChatComponent implements OnInit {
  protected readonly last = last;

  resultItem: ChatResultItem | SocialResultItem | null = null;
  arrayKeys: string[] = [];
  listItems: any[] = [];
  activeTab = '';
  content = '';
  summary = '';
  isExpandedMetadata = true
  username$!: Observable<string | null>;
  role$!: Observable<string | null>;

  constructor(private route: ActivatedRoute, protected authService: AuthService) {
    this.username$ = this.authService.getUsername$();
    this.role$ = this.authService.getRole$();
  }

  ngOnInit(): void {
    this.route.data.subscribe(({ reportdata }) => {
      this.resultItem = reportdata;
      this.processResultItem();
    });
  }

  metaadataToggleContent(): void {
    this.isExpandedMetadata = !this.isExpandedMetadata;
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
      if (this.arrayKeys.length > 0 && !this.activeTab) {
        this.setActiveTab(this.arrayKeys[0]);
      }
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
      this.listItems = (this.resultItem as any)[tab].slice(0, 100);
    } else {
      this.listItems = [];
    }
  }

  formatKeyLabel(key: string): string {
    const cleaned = key.replace(/^m_/, '').replace(/[^a-zA-Z0-9]/g, ' ');
    return cleaned.length < 4 ? cleaned.toUpperCase() : cleaned.toLowerCase().replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1));
  }
}
