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
import {SubscriptionService} from '../../../services/dashboard/subscription.service';

@Component({
  selector: 'app-report-header',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, TooltipDirective],
  templateUrl: './report-header.component.html',
  animations: [fadeInDashboardItem]
})
export class ReportHeaderComponent {
  @Input() csv_object: string | object | null | undefined = null;
  @Input() url: string | null | undefined = null;
  @Input() lang: string = "";
  @Input() content: string | null | undefined = null;
  @Input() lang_detected: string = "";

  @Output() languageUpdated = new EventEmitter<LeakResultItem | GeneralResultItem>();

  aiSuggestStatus = false;
  aiSuggestSummary = '';

  constructor(
    private helperService: HelperService,
    private api: ApiService,
    protected appService: AppService,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
    private subscriptionService: SubscriptionService
  ) {
  }

  downloadCSV() {
    this.helperService.downloadAsCSV(this.csv_object);
  }

  printPage() {
    this.helperService.printPage();
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
    if (!this.subscriptionService.isAdminOrSubscription()) {
      this.dashboardService.showSubscription.set(true);
      return;
    }

    this.api.post<{ result: string }>('nlp/summarize/ai', {
      data: [this.content]
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
        this.languageUpdated.emit(result);
      }
    });
  }

}
