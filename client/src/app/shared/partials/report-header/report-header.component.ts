import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { HelperService } from '../../services/helper.service';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';
import { ApiService } from '../../services/api.service';
import { fadeInDashboardItem } from '../../animations/dashboard.item.animation';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { GeneralResultItem } from '../../model/results/general/general.callback.model';
import { LeakResultItem } from '../../model/results/leak/leak.callback.model';
import { HttpParams } from '@angular/common/http';
import { AppService } from '../../../services/core/app/app.service';
import { SubscriptionService } from '../../../services/dashboard/subscription.service';
import { Router } from '@angular/router';
import { ReportExportService } from '../../services/report-export.service';
import { ExportChoiceModalComponent } from '../export-choice-modal/export-choice-modal.component';
import { REPORT_EXPORT_OPTIONS } from '../../model/report/export-choice.model';
import { LicenseService } from '../../../services/licenses/licenses.service';
@Component({
  selector: 'app-report-header',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, TooltipDirective, ExportChoiceModalComponent],
  templateUrl: './report-header.component.html',
  animations: [fadeInDashboardItem]
})
export class ReportHeaderComponent {
  aiSuggestStatus = false;
  aiSuggestSummary = '';
  isExportChoiceOpen = false;
  readonly reportExportOptions = REPORT_EXPORT_OPTIONS;

  @Input() csv_object: string | object | null | undefined = null;
  @Input() url: string | null | undefined = null;
  @Input() lang: string = "";
  @Input() content: string | null | undefined = null;
  @Input() lang_detected: string = "";

  @Output() languageUpdated = new EventEmitter<LeakResultItem | GeneralResultItem>();

  constructor(private helperService: HelperService, private api: ApiService, protected appService: AppService, private dashboardService: DashboardService, private cdr: ChangeDetectorRef, private subscriptionService: SubscriptionService, protected route: Router, protected licenseServise: LicenseService, private reportExportService: ReportExportService) {
  }

  downloadCSV() {
    const tree = this.route.parseUrl(this.route.url);
    const id = tree.root.children['primary'].segments.slice(-1)[0].path;
    let ci = tree.queryParams['ci'];
    if (ci === 'general') {
      ci = 'strategic';
    }
    if (ci === 'leak' || ci === "feed") {
      ci = 'breach';
    }
    this.api.get<any>(`search/${ci}/stix/${id}`).subscribe((res) => {
      this.helperService.downloadstixJson(res);
    });
  }

  openExportChoice() {
    this.isExportChoiceOpen = true;
  }

  closeExportChoice() {
    this.isExportChoiceOpen = false;
  }

  selectExport(type: string) {
    if (type === 'csv') {
      this.downloadCSV();
    }
    else {
      this.printPage();
    }
    this.closeExportChoice();
  }

  printPage() {
    try {
      const payload = this.reportExportService.buildUnifiedGraphPayload({
        currentRouteUrl: this.route.url,
        csvObject: this.csv_object,
        url: this.url,
        content: this.content,
        lang: this.lang,
        langDetected: this.lang_detected
      });
      this.reportExportService.exportByType(payload, 'graph_pdf');
    }
    catch {
      this.helperService.printPage();
    }
  }

  shareResult() {
    this.helperService.shareResult(this.url || '');
  }

  redirectToUrl() {
    if (this.url) {
      let url = this.url.trim();
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      window.open(url, '_blank');
    }
  }

  open_graph() {
    if (!this.licenseServise.canUseCtiGraph()) {
      this.dashboardService.showSubscription.set(true);
      return;
    }
    const baseUrl = `${window.location.origin}/dashboard/ctigraph`;
    const parts = window.location.pathname.split('/');
    const singleInput = parts[parts.length - 1];
    const params = new URLSearchParams({
      selectedType: 'document',
      singleInput
    });
    const fullUrl = `${baseUrl}?${params.toString()}`;
    window.open(fullUrl, '_blank');
  }

  aiSuggest() {
    if (!this.subscriptionService.accountExpirable()) {
      this.dashboardService.showSubscription.set(true);
      return;
    }
    this.api.post<{
          result: string;
      }>('nlp/summarize/ai', {
        data: [this.content]
      }).subscribe({
        next: (response) => {
          this.aiSuggestStatus = true;
          this.aiSuggestSummary = response.result || 'No summary available';
          this.cdr.detectChanges();
        },
        error: (_err) => {
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
        this.languageUpdated.emit(result);
      }
    });
  }
}
