import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { AppService } from '../../../../services/core/app/app.service';
import { JsonApiViewerComponent } from '../../../../shared/partials/json-api-viewer/json-api-viewer.component';
import { ReportMappingComponent } from '../../../../shared/partials/report-mapping/report-mapping.component';
import { DefacementResultItem } from '../../../../shared/model/results/defacement/defacement.callback.model';
import { ReportHeaderComponent } from '../../../../shared/partials/report-header/report-header.component';
import { ResultSectionComponent } from '../../../../shared/partials/result-components/result-section/result-section.component';
import { ResultListComponent } from '../../../../shared/partials/result-components/result-list/result-list.component';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { formatKeyLabel as formatKeyLabelUtil, formatTitleUrl as formatTitleUrlUtil, normalizeDisplayUrl as normalizeDisplayUrlUtil } from '../../../../shared/utils/intel-report.util';
import { ScrollService } from '../../../../shared/services/scroll.service';
import { ReportInteractionHostComponent } from '../../social-interactions/report-interaction-host/report-interaction-host.component';

@Component({
  selector: 'app-report-defacement',
  templateUrl: './report-defacement.component.html',
  imports: [
    CommonModule,
    DatePipe,
    JsonApiViewerComponent,
    ReportMappingComponent,
    ReportHeaderComponent,
    ResultSectionComponent,
    ResultListComponent,
    NgClass,
    TooltipDirective,
    ReportInteractionHostComponent
  ]
})
/* eslint-disable local/class-field-group-spacing */
export class ReportDefacementComponent implements OnInit, AfterViewInit {
  defacementData: DefacementResultItem | null = null;
  lang: string = 'en';
  isExpandedMetadata: boolean = true;
  activeTab: string = '';
  content: string = '';
  listItems: any[] = [];
  arrayKeys: string[] = [];
  isTakingDown: boolean = false;
  showTakedownModal: boolean = false;
  pollingInterval: any = null;
  actionResult: any = null;

  constructor(private route: ActivatedRoute, private appService: AppService, private scrollService: ScrollService, private elementRef: ElementRef<HTMLElement>, private http: HttpClient) {
    this.lang = this.appService.getConfig().appSettings.language_allowed;
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data['reportdata']) {
        this.defacementData = data['reportdata'] as DefacementResultItem;
        this.prepareMetadata();
        this.scrollToTop();
      }
    });
  }

  ngAfterViewInit(): void {
    this.scrollToTop();
  }

  private scrollToTop(): void {
    this.scrollService.scrollReportToTop();
    this.elementRef.nativeElement.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  get filteredArrayKeys(): string[] {
    return this.arrayKeys.filter(key => {
      const val = (this.defacementData as any)?.[key];
      return val != null && (!Array.isArray(val) || val.length > 0);
    });
  }

  metadataToggleContent(): void {
    this.isExpandedMetadata = !this.isExpandedMetadata;
  }

  setActiveTab(tab: string): void {
    if (this.activeTab === tab) {
      this.activeTab = '';
      this.listItems = [];
      return;
    }
    this.activeTab = tab;
    if (this.defacementData && Array.isArray((this.defacementData as any)[tab])) {
      this.listItems = (this.defacementData as any)[tab];
    }
    else {
      this.listItems = [];
    }
  }

  formatKeyLabel(key: string): string {
    return formatKeyLabelUtil(key);
  }

  private prepareMetadata(): void {
    this.content = this.defacementData?.m_content || '';
    this.arrayKeys = [];
    if (Array.isArray((this.defacementData as any)?.m_section) && (this.defacementData as any).m_section.length > 0) {
      this.arrayKeys.push('m_section');
    }
    if (this.defacementData?.m_content && this.defacementData.m_content.trim() !== '') {
      this.arrayKeys.push('m_content');
    }
    if (this.defacementData) {
      Object.keys(this.defacementData).forEach(key => {
        const value = (this.defacementData as any)[key];
        if (Array.isArray(value) && value.length > 0 && key !== 'm_section') {
          this.arrayKeys.push(key);
        }
      });
    }
    const keys = this.filteredArrayKeys;
    if (keys.length > 0) {
      this.setActiveTab(keys[0]);
    }
  }

  formatTitleUrl(url?: string | null): string {
    return formatTitleUrlUtil(url, '-');
  }

  normalizeDisplayUrl(url?: string | string[] | null): string {
    const rawUrl = Array.isArray(url) ? (url[0] || '') : (url || '');
    return normalizeDisplayUrlUtil(rawUrl, '-');
  }

  get reportDocId(): string {
    return (this.defacementData as any)?.m_hash || (this.defacementData as any)?._id || '';
  }

  initiateTakedown(): void {
    if (!this.defacementData?.m_url) {
      return;
    }

    this.showTakedownModal = true;
    this.isTakingDown = true;
    this.actionResult = null;

    const user: any = this.appService.userSessionData()?.user;
    const userId = user?.id || user?._id || 'test_user';

    const baseUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:8010'
      : 'https://api.orionintelligence.org/microservices';

    const apiUrl = `${baseUrl}/evidence/capture/${userId}`;
    const payload = { target_url: this.defacementData.m_url };

    this.http.post(apiUrl, payload).subscribe({
      next: (res: any) => {
        if (res.status === 'pending') {
          this.startPolling(apiUrl, payload);
        }
        else if (res.status === 'done') {
          this.handleSuccess(res.result);
        }
      },
      error: (err) => {
        this.isTakingDown = false;
        console.error(err);
        alert('Failed to connect to Microservice.');
      }
    });
  }

  startPolling(apiUrl: string, payload: any): void {
    let attempts = 0;
    const maxAttempts = 30;

    this.pollingInterval = setInterval(() => {
      attempts++;
      this.http.post(apiUrl, payload).subscribe({
        next: (res: any) => {
          if (res.status === 'done') {
            clearInterval(this.pollingInterval);
            this.handleSuccess(res.result);
          }
          else if (attempts >= maxAttempts) {
            clearInterval(this.pollingInterval);
            this.isTakingDown = false;
            alert('Takedown process timed out.');
          }
        },
        error: (err) => {
          clearInterval(this.pollingInterval);
          this.isTakingDown = false;
          console.error(err);
        }
      });
    }, 4000);
  }

  handleSuccess(result: any): void {
    this.isTakingDown = false;
    this.actionResult = {
      screenshot_path: result.screenshot_path,
      html_path: result.html_path,
      abuse_email: result.abuse_email_found || 'Not found automatically'
    };
  }

  closeTakedownModal(): void {
    this.showTakedownModal = false;
    if (this.isTakingDown && this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.isTakingDown = false;
    }
  }

  getEvidenceUrl(fullPath: string): string {
    if (!fullPath) {
      return '';
    }
    const filename = fullPath.split('/').pop();
    const baseUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:8010'
      : 'https://api.orionintelligence.org/microservices';
    return `${baseUrl}/evidence/view/image/${filename}`;
  }

  sendActualEmail(): void {
    if (!this.actionResult) {
      return;
    }

    const apiUrl = `/api/evidence/dispatch`;

    let domain = this.defacementData?.m_url || '';
    domain = domain.replace(/^https?:\/\//, '').split(/[/?#]/)[0];

    const payload = {
      abuse_email: this.actionResult.abuse_email,
      target_domain: domain,
      screenshot_path: this.actionResult.screenshot_path,
      html_path: this.actionResult.html_path
    };

    this.http.post(apiUrl, payload).subscribe({
      next: (res: any) => {
        if (res.status === 'done') {
          alert('✅ Takedown Email Dispatched Successfully to ' + payload.abuse_email);
          this.closeTakedownModal();
        }
        else {
          alert('❌ Failed to send email. Check logs.');
        }
      },
      error: (err) => {
        console.error(err);
        alert('Error connecting to email dispatcher.');
      }
    });
  }
}
