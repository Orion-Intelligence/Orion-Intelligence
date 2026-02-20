import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatResultItem } from '../../../model/results/chat/chat.callback.model';
import { CommonModule, NgForOf, NgIf, SlicePipe, } from '@angular/common';
import { ResultListComponent } from '../../result-components/result-list/result-list.component';
import { ResultSectionComponent } from '../../result-components/result-section/result-section.component';
import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
import { TooltipDirective } from '../../../directive/tooltip-directive.directive';
import { JsonApiViewerComponent } from '../../json-api-viewer/json-api-viewer.component';
import { last, Observable } from 'rxjs';
import { AuthService } from '../../../../services/authetication/auth.service';
import { SocialResultItem } from '../../../model/results/social/social.callback.model';
import { ReportHeaderComponent } from '../../report-header/report-header.component';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { ChatWidgetComponent } from '../../chat-widget/chat-widget.component';
import { AppService } from '../../../../services/core/app/app.service';
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
    JsonApiViewerComponent, TooltipDirective, ReportHeaderComponent, ChatWidgetComponent
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
  isExpandedMetadata = true;

  constructor(protected appService: AppService, private route: ActivatedRoute, protected authService: AuthService, public dashboardService: DashboardService, private router: Router) {
  }

  ngOnInit(): void {
    this.route.data.subscribe(({ reportdata }) => {
      this.resultItem = reportdata;
      this.processResultItem();
    });
  }

  metaadataToggleContent(): void {
    this.isExpandedMetadata = !this.isExpandedMetadata;
    if (this.router.url.split('?')[0] != this.dashboardService.m_current_route) {
      this.ngOnInit();
    }
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
        if (Array.isArray(value) &&
                    value.length > 0 &&
                    !addedKeys.has(key)) {
          this.arrayKeys.push(key);
          addedKeys.add(key);
        }
      });
      if (!this.activeTab) {
        let selectedTab = '';
        if (this.arrayKeys.includes('m_email')) {
          selectedTab = 'm_email';
        }
        else if (this.arrayKeys.includes('m_entity')) {
          selectedTab = 'm_entity';
        }
        else if (this.arrayKeys.includes('m_content_type')) {
          selectedTab = 'm_content_type';
        }
        else if (this.arrayKeys.length > 0) {
          selectedTab = this.arrayKeys[0];
        }
        if (selectedTab) {
          this.setActiveTab(selectedTab);
          const index = this.arrayKeys.indexOf(selectedTab);
          if (index > 0) {
            this.arrayKeys.splice(index, 1);
            this.arrayKeys.unshift(selectedTab);
          }
        }
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
    }
    else if (this.resultItem && Array.isArray((this.resultItem as any)[tab])) {
      this.listItems = (this.resultItem as any)[tab].slice(0, 100);
    }
    else {
      this.listItems = [];
    }
  }

  getContentLines(item: any): string[] {
    return item?.m_content
      ? item.m_content
        .split('\n')
        .filter((line: string) => line.trim() && (line.match(/ /g) || []).length > 5)
      : [];
  }

  getContentWithoutEmptyLines(content: string | undefined): string {
    if (!content) {
      return "";
    }
    return (content || '')
      .split('\n')
      .filter(line => line.trim().length > 0)
      .join('\n');
  }

  hasCodeType(obj: any): boolean {
    const t = obj?.m_content_type;
    return Array.isArray(t) ? t.some((x: string) => x?.includes('code')) : (typeof t === 'string' && t.includes('code'));
  }

  formatKeyLabel(key: string): string {
    const cleaned = key.replace(/^m_/, '').replace(/[^a-zA-Z0-9]/g, ' ');
    return cleaned.length < 4 ? cleaned.toUpperCase() : cleaned.toLowerCase().replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1));
  }
}
