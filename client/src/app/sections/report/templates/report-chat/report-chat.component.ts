import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatResultItem } from '../../../../shared/model/results/chat/chat.callback.model';
import { CommonModule, NgClass, SlicePipe } from '@angular/common';
import { ResultListComponent } from '../../../../shared/partials/result-components/result-list/result-list.component';
import { ResultSectionComponent } from '../../../../shared/partials/result-components/result-section/result-section.component';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { JsonApiViewerComponent } from '../../../../shared/partials/json-api-viewer/json-api-viewer.component';
import { last } from 'rxjs';
import { AuthService } from '../../../../services/authetication/auth.service';
import { SocialResultItem } from '../../../../shared/model/results/social/social.callback.model';
import { ReportHeaderComponent } from '../../../../shared/partials/report-header/report-header.component';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { ChatWidgetComponent } from '../../../../pages/root-searches/ai-workspace/chat-widget/chat-widget.component';
import { AppService } from '../../../../services/core/app/app.service';
import { ScrollService } from '../../../../shared/services/scroll.service';
import { formatKeyLabel as formatKeyLabelUtil, formatTitleUrl as formatTitleUrlUtil, getDisplayTitle as getDisplayTitleUtil, isLikelyUrl as isLikelyUrlUtil, normalizeDisplayUrl as normalizeDisplayUrlUtil } from '../../../../shared/utils/intel-report.util';
import { ScanHelperMethodsService } from '../../../../pages/root-searches/network-intel/network-intel-service.service';
import { ReportInteractionHostComponent } from '../../social-interactions/report-interaction-host/report-interaction-host.component';
@Component({
  selector: 'app-report-chat',
  templateUrl: './report-chat.component.html',
  standalone: true,
  imports: [
    ResultListComponent,
    ResultSectionComponent,
    SlicePipe,
    CommonModule,
    NgClass,
    JsonApiViewerComponent,
    TooltipDirective,
    ReportHeaderComponent,
    ChatWidgetComponent,
    ReportInteractionHostComponent
  ],
  animations: [fadeInDashboardItem]
})
export class ReportChatComponent implements OnInit, AfterViewInit {
  protected readonly last = last;

  resultItem: ChatResultItem | SocialResultItem | null = null;
  arrayKeys: string[] = [];
  listItems: any[] = [];
  activeTab = '';
  content = '';
  summary = '';
  isExpandedMetadata = true;

  constructor(protected appService: AppService, private route: ActivatedRoute, protected authService: AuthService, public dashboardService: DashboardService, private router: Router, private scrollService: ScrollService, private elementRef: ElementRef<HTMLElement>, private scanHelperMethodsService: ScanHelperMethodsService) {
  }

  ngOnInit(): void {
    this.route.data.subscribe(({ reportdata }) => {
      this.resultItem = reportdata;
      this.processResultItem();
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
    return formatKeyLabelUtil(key);
  }

  private isLikelyUrl(value: string): boolean {
    return isLikelyUrlUtil(value);
  }

  private formatTitleUrl(url?: string | null): string {
    return formatTitleUrlUtil(url, '');
  }

  getDisplayChannelTitle(name?: string | null, fallbackUrl?: string | null): string {
    return getDisplayTitleUtil(name, fallbackUrl, 'Untitled Channel');
  }

  normalizeDisplayUrl(url?: string | null): string {
    return normalizeDisplayUrlUtil(url, '-');
  }

  hasValue(value: unknown): boolean {
    return this.scanHelperMethodsService.hasRenderableValue(value);
  }

  getMetadataRows(): { label: string; value: string; long?: boolean }[] {
    if (!this.resultItem) {
      return [];
    }

    const item = this.resultItem as any;
    const rows: { label: string; value: string; long?: boolean }[] = [];
    const add = (label: string, value: unknown, long = false) => {
      if (!this.hasValue(value)) {
        return;
      }
      rows.push({
        label,
        value: Array.isArray(value) ? value.join(', ') : String(value),
        long
      });
    };

    add('Message Date', item.m_message_date);
    add('Views', item.m_views);
    add('Sender Username', item.m_sender_username);
    add('Sender', item.m_sender_name);
    add('Message ID', item.m_message_id, true);
    add('Platform', item.m_platform);
    add('Network', item.m_network);
    add('Post Likes', item.m_post_likes);
    add('Post Shares', item.m_post_shares);
    add('Post Comments', item.m_post_comments_count);
    add('Post Tags', item.m_post_tags, true);
    add('Post Views', item.m_post_views);
    add('Post Expiry', item.m_post_expiry);
    add('Comment Count', item.m_comment_count);
    add('Likes', item.m_likes);
    add('Retweets', item.m_retweets);
    add('Commenters', item.m_commenters, true);

    return rows;
  }

  get reportDocId(): string {
    return (this.resultItem as any)?.m_hash || (this.resultItem as any)?._id || '';
  }
}
