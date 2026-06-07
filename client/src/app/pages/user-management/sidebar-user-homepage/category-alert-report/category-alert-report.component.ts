import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryAlerts } from '../../../../shared/model/alert-notification/alert.notification.model';
import { AlertAllIoc, AlertModel } from '../../../../shared/model/company-profile/node.model';
import { map, Observable } from 'rxjs';
import { AppService } from '../../../../services/core/app/app.service';
import { search_filter_labels } from '../../../../shared/constants/shared-enums';
import { AddCustomAlertComponent } from "../add-custom-alert/add-custom-alert.component";
import { SidebarService } from '../../../../shared/services/sidebar.service';
import { FilterModel } from '../../../../shared/model/filter/filter.model';
import { alert_filters } from '../../../../shared/constants/filters';
import { FiltersComponent } from "../../../../shared/partials/filters/filters.component";
import { ApiService } from '../../../../shared/services/api.service';
import { MessageNotificationService } from '../../../../services/message_notification/message-notification.service';
import { LicenseService } from '../../../../services/licenses/licenses.service';
import { ConfirmationPopupComponent } from "../../../../shared/partials/confirmation-popup/confirmation-popup.component";
import { HelperService } from '../../../../shared/services/helper.service';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { EmptyResultComponent } from '../../../../shared/partials/empty-result/empty-result.component';
import { ExportChoiceModalComponent } from '../../../../shared/partials/export-choice-modal/export-choice-modal.component';
import { ExportChoiceOption } from '../../../../shared/model/report/export-choice.model';
import { AlertExportService } from '../../../../shared/services/export/alert-export.service';
import { SidebarHomepageService } from '../../../../services/dashboard/sidebar.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-category-alert-report',
  imports: [CommonModule, FormsModule, AddCustomAlertComponent, FiltersComponent, ConfirmationPopupComponent, TooltipDirective, EmptyResultComponent, ExportChoiceModalComponent, TranslatePipe],
  templateUrl: './category-alert-report.component.html',
})
export class CategoryAlertReportComponent implements OnInit {
  private appendTimer: ReturnType<typeof setTimeout> | null = null;
  private alertLookupById = new Map<string, AlertModel>();

  filterModel: FilterModel = alert_filters;
  alerts: CategoryAlerts[] = []
  filteredAlerts: CategoryAlerts[] = []
  visibleFilteredAlerts: CategoryAlerts[] = [];
  readonly serverPageSize: number = 20;
  readonly incrementalDelayMs: number = 90;
  currentPage: number = 0;
  hasMoreAlerts: boolean = false;
  isLoadingMoreAlerts: boolean = false;
  isInitialLoading: boolean = false;
  activeDateRange: string | null = null;
  searchText: string = '';
  category: string = '';
  iocTypes: Record<string, string> = { ...search_filter_labels };
  showCustomAlertPopup: boolean = false;
  showEditAlertPopup: boolean = false;
  isFilterOpen$: Observable<boolean>;
  selectedAlert!: AlertModel;
  isFlushAllConfirmationOpen = signal(false);
  isDeleteAlertConfirmationOpen = signal(false);
  selectedDeleteAlertId: string = '';
  importedAlert: AlertModel | null = null;
  alertToShowReport: AlertModel | null = null;
  isExportChoiceOpen: boolean = false;
  readonly alertExportOptions: ExportChoiceOption[] = [{ value: 'report', title: 'Export Report (PDF)', description: 'Generate PDF export for selected alert.', testId: 'category-alert-export-option-report' }];
  expandedAlertIds = new Set<string>();
  hoveredReportTool: 'add' | 'import' | 'flush' | 'sidebar' | null = null;

  constructor( private router: Router, private route: ActivatedRoute, public appService: AppService, public sidebarService: SidebarService, private apiService: ApiService, private messageNotificationService: MessageNotificationService, protected licenseService: LicenseService, private helperService: HelperService, private alertExportService: AlertExportService, private sidebarHomepageService: SidebarHomepageService ) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  private decrementUnseenSummary(by: number = 1): void {
    const summary = this.appService.userSessionData().alert_summary;
    if (!summary) {
      return;
    }
    this.appService.userSessionData().alert_summary = {
      ...summary,
      unseen_total: Math.max(0, Number(summary.unseen_total || 0) - by)
    };
  }

  isLightTheme(): boolean {
    return document.body.classList.contains('light-theme');
  }

  setReportToolHover(tool: 'add' | 'import' | 'flush' | 'sidebar' | null): void {
    this.hoveredReportTool = tool;
  }

  applySearch(value: string): void {
    this.searchText = value;
    this.applyCurrentFilters();
  }

  ngOnInit(): void {
    this.route.url.pipe(map(segments => {
      if (segments && segments.length > 0) {
        return segments[segments.length - 1].path;
      }
      return '';
    })).subscribe(lastSegment => {
      this.category = lastSegment;
      this.getLatestAlerts();
    });
  }

  private clearAppendTimer(): void {
    if (this.appendTimer) {
      clearTimeout(this.appendTimer);
      this.appendTimer = null;
    }
  }

  private appendVisibleAlertsIncrementally(items: CategoryAlerts[], reset: boolean): void {
    this.clearAppendTimer();
    this.visibleFilteredAlerts = reset ? [] : [...this.visibleFilteredAlerts];

    if (items.length === 0) {
      this.isLoadingMoreAlerts = false;
      return;
    }

    let index = 0;
    const appendNext = () => {
      if (index >= items.length) {
        this.isLoadingMoreAlerts = false;
        this.appendTimer = null;
        return;
      }

      this.visibleFilteredAlerts = [...this.visibleFilteredAlerts, items[index]];
      index += 1;
      this.appendTimer = setTimeout(appendNext, this.incrementalDelayMs);
    };

    appendNext();
  }

  private loadAlertsPage(reset: boolean): void {
    if (!this.category || this.isLoadingMoreAlerts) {
      return;
    }

    const nextPage = reset ? 1 : this.currentPage + 1;
    this.isLoadingMoreAlerts = true;
    if (reset) {
      this.isInitialLoading = true;
    }
    const endpoint = `profile/alerts?paginate=true&page=${nextPage}&limit=${this.serverPageSize}&alert_type=${encodeURIComponent(this.category)}`;

    this.apiService.get<any>(endpoint).subscribe({
      next: response => {
        const rawItems: AlertModel[] = response?.items || [];
        for (const item of rawItems) {
          if (item?.alert_id) {
            this.alertLookupById.set(item.alert_id, item);
          }
        }
        const convertedItems = this.convertAlertsList(rawItems, this.category);

        this.currentPage = response?.page || nextPage;
        this.hasMoreAlerts = !!response?.has_more;
        this.alerts = reset ? convertedItems : [...this.alerts, ...convertedItems];
        this.isInitialLoading = false;

        if (this.activeDateRange || this.searchText.trim()) {
          this.applyCurrentFilters();
          this.isLoadingMoreAlerts = false;
          return;
        }

        this.filteredAlerts = [...this.alerts];
        this.appendVisibleAlertsIncrementally(convertedItems, reset);
      },
      error: () => {
        this.isLoadingMoreAlerts = false;
        this.isInitialLoading = false;
      }
    });
  }

  canLoadMoreAlerts(): boolean {
    return this.hasMoreAlerts;
  }

  loadMoreAlerts(): void {
    if (!this.canLoadMoreAlerts()) {
      return;
    }
    this.loadAlertsPage(false);
  }

  flushAll() {
    this.isFlushAllConfirmationOpen.set(true);
  }

  flushAllConfirmation(value: boolean) {
    this.isFlushAllConfirmationOpen.set(false);
    if (value) {
      this.apiService.post(`profile/alerts/delete/${this.category}`, null).subscribe({
        next: () => {
          this.getLatestAlerts();
          this.router.navigate(["/dashboard"], {});
        },
        error: (err) => {
          this.messageNotificationService.show(err?.error?.detail || 'Failed to delete')
        },
      });
    }
  }

  showAlertPopup(action: string, id: string) {
    switch (action) {
      case 'edit':
        const alert = this.alertLookupById.get(id);
        if (alert) {
          this.selectedAlert = alert;
          this.showEditAlertPopup = true;
        }
        break;

      case 'add':
        this.showCustomAlertPopup = true;
        break;

      default:
        break;
    }
  }

  isAlertExpanded(id: string): boolean {
    return this.expandedAlertIds.has(id);
  }

  toggleAlertExpanded(id: string): void {
    if (this.expandedAlertIds.has(id)) {
      this.expandedAlertIds.delete(id);
      return;
    }
    this.expandedAlertIds.add(id);
  }

  exportAlert(hash: string) {
    let apiUrl = '';
    switch (this.category) {
      case 'breach':
        apiUrl = hash ? `search/breach/stix/${hash}` : `search/breach`;
        break;
      case 'strategic':
        apiUrl = hash ? `search/strategic/stix/${hash}` : `search/strategic`;
        break;
      case 'defacement':
        apiUrl = hash ? `search/defacement/stix/${hash}` : `search/defacement`;
        break;
      case 'exploit':
        apiUrl = hash ? `search/exploit/stix/${hash}` : `search/exploit`;
        break;
      case 'social':
        apiUrl = hash ? `search/social/stix/${hash}` : `search/social`;
        break;
      case 'feed':
        apiUrl = hash ? `search/news/stix/${hash}` : `search/news`;
        break;
      default:
        this.router.navigate(['/']).then();
    }


    this.apiService.get<any>(apiUrl).subscribe({
      next: (response) => {
        if (response) {
          this.helperService.downloadstixJson(response);
        }
      }
    });


  }

  canExportstix() {
    const allowedCategories = [
      'breach',
      'strategic',
      'general',
      'defacement',
      'exploit',
      'social',
      'feed'
    ];
    return allowedCategories.includes(this.category);
  }

  cancleAlertPopup(refresh: boolean) {
    if (refresh) {
      this.getLatestAlerts();
    }
    this.showCustomAlertPopup = false;
    this.showEditAlertPopup = false;
  }

  deleteAlertConfirmation(id: string) {
    this.selectedDeleteAlertId = id;
    this.isDeleteAlertConfirmationOpen.set(true);
  }

  deleteCustomAlert(confirmed: boolean, id: string) {
    this.isDeleteAlertConfirmationOpen.set(false);
    this.selectedDeleteAlertId = '';

    if (!confirmed || !id) {
      return;
    }

    this.apiService.post('alert/delete', id).subscribe({
      next: () => {
        this.messageNotificationService.show('Alert deleted successfully!', 'success');
        this.getLatestAlerts();
      },
      error: (err) => {
        const mess = err?.error?.detail || 'delete alert failed'
        this.messageNotificationService.show(mess)
      },
    });
  }

  getLatestAlerts() {
    this.currentPage = 0;
    this.hasMoreAlerts = false;
    this.isInitialLoading = true;
    this.alertLookupById.clear();
    this.alerts = [];
    this.filteredAlerts = [];
    this.visibleFilteredAlerts = [];
    this.loadAlertsPage(true);
  }

  seeDetailReprot(alertId: string) {
    this.alertToShowReport = this.alertLookupById.get(alertId) || null;

    if (!this.alertToShowReport) {
      return;
    }
    if (this.alertToShowReport) {
      this.alertToShowReport.report_seen = true;
      this.apiService.post('alert/seen', [this.alertToShowReport]).subscribe({
        next: () => {
          this.decrementUnseenSummary(1);
        }
      });
      this.openExportChoice();
    }
  }

  openExportChoice(): void {
    this.isExportChoiceOpen = true;
  }

  closeExportChoice(): void {
    this.isExportChoiceOpen = false;
  }

  exportSelectedAlert(_type: string): void {
    if (!this.alertToShowReport) {
      this.closeExportChoice();
      return;
    }
    this.alertExportService.exportPdf([this.alertToShowReport], 'Brand Alerts');
    this.closeExportChoice();
  }

  seeDetails(id: string, hash: string) {
    this.licenseService.loadLicenses().subscribe(licenses => {
      const hasEnterprise = licenses.includes('enterprise');

      if (hasEnterprise) {

        const _alert = this.alertLookupById.get(id);
        if (_alert?.type) {
          const value = _alert.ioc_value || '-';
          let scanType: string;
          let route: string = '/dashboard/scanner/network-scan';

          switch (_alert.type.toLowerCase()) {
            case "advance scanning":
              scanType = "advance";
              route = "/dashboard/scanner/network-scan";
              this.router.navigate([route], {
                queryParams: { page: 1, domain: encodeURIComponent(value), canType: scanType }
              });
              break;

            case "seo scanning":
              scanType = "seo";
              route = "/dashboard/scanner/seo-scan";
              this.router.navigate([route], {
                queryParams: { page: 1, domain: encodeURIComponent(value), canType: scanType }
              });
              break;

            case "repo scanning":
              scanType = "repo";
              route = "/dashboard/scanner/repository-scan";
              this.router.navigate([route], {
                queryParams: { page: 1, domain: encodeURIComponent(value), canType: scanType }
              });
              break;
            case "email-breach":
              const _username = value.split('@')[0];
              scanType = "repo";
              route = "/dashboard/api/email-breach";
              this.router.navigate([route], {
                queryParams: { username: _username, email: value }
              });
              break;
            case "playstore-scanning":
              scanType = "repo";
              route = "/dashboard/api/playstore-scanner";
              this.router.navigate([route], {
                queryParams: { playstore: value }
              });
              break;
            case "social-scanner":
              scanType = "repo";
              route = "/dashboard/api/social-scanner";
              this.router.navigate([route], {
                queryParams: { username: value }
              });
              break;
            case "stealerlogs":
              route = "/dashboard/stealerlogs/credential";
              const queryParams: any = {
                q: "",
                page: 1,
                category: "credential",
                fullsearch: true,
                matchtype: "or",
                must: false
              };
              if (this.isDomain(value)) {
                queryParams.domain = value;
              }
              else {
                queryParams.user = value;
              }
              this.router.navigate([route], { queryParams });
              break;
            default:
              this.router.navigate([`/dashboard/${this.category}/all/${hash}`]);
              break;
          }


        }
        if (_alert) {
          _alert.report_seen = true;
          this.apiService.post('alert/seen', [_alert]).subscribe({
            next: () => {
              this.decrementUnseenSummary(1);
            }
          });
        }
      }
      else {
        this.messageNotificationService.show("Please purchase enterprise license to view reports")
      }
    });

  }

  convertAlertsList(alerts: AlertModel[], targetType: string): CategoryAlerts[] {
    if (!alerts || alerts.length === 0) {
      return [];
    }
    const filteredAlerts = alerts.filter(alert => alert.type === targetType);
    return filteredAlerts.map(alert => this.convertToCategoryAlert(alert));
  }

  convertToCategoryAlert(alert: AlertModel): CategoryAlerts {
    const entity = alert.ioc_value || 'N/A';

    return {
      id: alert.alert_id || '',
      seen: alert.report_seen || false,
      custom: alert.custom_alert || false,
      risk: this.getRiskLevel(alert.type!),
      category: alert.type || 'unknown',
      title: alert.title || 'No Title',
      description: alert.description || 'No description provided.',
      hash: alert.data_hash || 'NO_HASH',
      source: alert.source || 'N/A',
      url: alert.url || 'N/A',
      entity: entity,

      allIOC: alert.all_ioc || [],
      detectedOn: alert.first_seen || new Date(),
    };
  }

  getRiskLevel(type: string): string {
    return this.sidebarHomepageService.getRiskLevel(type);
  }

  getRiskIcon(risk: string): string {
    switch ((risk || '').toLowerCase()) {
      case 'critical':
        return 'bi-exclamation-octagon-fill';
      case 'high':
        return 'bi-exclamation-triangle-fill';
      case 'medium':
        return 'bi-exclamation-circle-fill';
      case 'low':
        return 'bi-info-circle-fill';
      default:
        return 'bi-info-circle-fill';
    }
  }

  getRiskIconColorClass(risk: string): string {
    switch ((risk || '').toLowerCase()) {
      case 'critical':
        return 'category_report_status-critical';
      case 'high':
        return 'category_report_status-high';
      case 'medium':
        return 'category_report_status-medium';
      case 'low':
        return 'category_report_status-low';
      default:
        return 'category_report_status-low';
    }
  }

  sliceString(text: string, maxLength: number): string {
    if (typeof text !== 'string' || text === null || text === undefined) {
      return '';
    }
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength) + '...';
  }

  hasAlertUrl(url: string): boolean {
    const normalizedUrl = (url || '').trim().toLowerCase();
    return !!normalizedUrl && !['-', 'n/a', 'none', 'null'].includes(normalizedUrl);
  }

  getFilteredIocs(allIOC: AlertAllIoc[]): { label: string, count: number }[] {
    if (!allIOC || allIOC.length === 0) {
      return [];
    }

    const mergedIocMap = new Map<string, AlertAllIoc>();

    for (const ioc of allIOC) {
      const existingIoc = mergedIocMap.get(ioc.name);

      if (existingIoc) {
        if (ioc.values.length > existingIoc.values.length) {
          mergedIocMap.set(ioc.name, ioc);
        }
      }
      else {
        mergedIocMap.set(ioc.name, ioc);
      }
    }
    return Array.from(mergedIocMap.values())
      .filter(ioc => Object.prototype.hasOwnProperty.call(this.iocTypes, ioc.name))
      .map(ioc => ({
        label: this.iocTypes[ioc.name],
        count: ioc.values.length
      }))
      .filter(ioc => !!ioc.label && ioc.count > 0);
  }

  countUniqueSources(alerts: CategoryAlerts[]): number {
    const uniqueSources = new Set<string>();
    for (const alert of alerts) {
      if (alert.source) {
        uniqueSources.add(alert.source);
      }
    }
    return uniqueSources.size;
  }

  getLatestDetectedDate(alerts: CategoryAlerts[]): string {
    const validDates = alerts
      .map(alert => alert.detectedOn instanceof Date
        ? alert.detectedOn
        : new Date(alert.detectedOn))
      .filter(date => !isNaN(date.getTime())); // ensures valid date

    if (validDates.length === 0) {
      return '-';
    }

    const latestDate = validDates.reduce((latest, current) =>
      current.getTime() > latest.getTime() ? current : latest);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return `${dayNames[latestDate.getDay()]}, ${latestDate.getDate()} ${monthNames[latestDate.getMonth()]} ${latestDate.getFullYear()}`;
  }

  getTotalUniqueIocValueCount(alerts: CategoryAlerts[]): number {
    if (!alerts || alerts.length === 0) {
      return 0;
    }
    const totalUniqueValues = new Set<string>();

    for (const alert of alerts) {
      const allIOC: AlertAllIoc[] = alert.allIOC || [];

      if (allIOC.length === 0) {
        continue;
      }
      const mergedIocMap = new Map<string, AlertAllIoc>();

      for (const ioc of allIOC) {
        const existingIoc = mergedIocMap.get(ioc.name);

        if (existingIoc && ioc.values.length > existingIoc.values.length) {
          mergedIocMap.set(ioc.name, ioc);
        }
        else if (!existingIoc) {
          mergedIocMap.set(ioc.name, ioc);
        }
      }
      Array.from(mergedIocMap.values())
        .filter(ioc => Object.prototype.hasOwnProperty.call(this.iocTypes, ioc.name))
        .forEach(ioc => {
          ioc.values.forEach(value => {
            if (value) {
              totalUniqueValues.add(value);
            }
          });
        });
    }

    return totalUniqueValues.size;
  }

  getNewAlertCount(): number {
    return this.filteredAlerts.filter(alert => !alert.seen).length;
  }

  applyFilter(filters: Record<string, string | null>) {
    const range = filters['daterange'];
    this.activeDateRange = range || null;
    this.applyCurrentFilters();
  }

  private applyCurrentFilters(): void {
    this.clearAppendTimer();
    if (!this.isInitialLoading) {
      this.isLoadingMoreAlerts = false;
    }
    let result = [...this.alerts];

    if (this.activeDateRange) {
      const [startStr, endStr] = this.activeDateRange.split(',');
      const startDate = new Date(startStr);
      const inclusiveEnd = new Date(endStr);
      inclusiveEnd.setHours(23, 59, 59, 999);
      result = result.filter(alert => {
        const lastSeenDate = new Date(alert.detectedOn);
        return lastSeenDate >= startDate && lastSeenDate <= inclusiveEnd;
      });
    }

    const query = this.searchText.trim().toLowerCase();
    if (query) {
      result = result.filter(alert => this.getAlertSearchText(alert).includes(query));
    }

    this.filteredAlerts = result;
    this.visibleFilteredAlerts = [...result];
  }

  private getAlertSearchText(alert: CategoryAlerts): string {
    const iocText = (alert.allIOC || [])
      .flatMap(ioc => [ioc.name, this.iocTypes[ioc.name], ...(ioc.values || [])])
      .join(' ');
    return [
      alert.title,
      alert.description,
      alert.entity,
      alert.source,
      alert.category,
      alert.risk,
      alert.url,
      iocText
    ].join(' ').toLowerCase();
  }

  filterByDate(start: Date, end: Date) {
    const inclusiveEnd = new Date(end);
    inclusiveEnd.setHours(23, 59, 59, 999);

    this.filteredAlerts = this.alerts.filter(alert => {
      const lastSeenDate = new Date(alert.detectedOn);
      return lastSeenDate >= start && lastSeenDate <= inclusiveEnd;
    });
    this.visibleFilteredAlerts = [...this.filteredAlerts];
  }

  isDomain(value: string): boolean {
    if (!value) {
      return false;
    }

    value = value.replace(/https?:\/\//, "").replace(/^www\./, "");

    const domainRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})*$/;

    return domainRegex.test(value);
  }

  onFileUpload(event: any) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const jsonData = JSON.parse(reader.result as string);

        if (Array.isArray(jsonData)) {
          this.messageNotificationService.show('Only one STIX bundle is allowed per upload');
          return;
        }

        this.importedAlert = this.validateAlert(jsonData);

        this.apiService.post('alert/add', this.importedAlert).subscribe({
          next: () => {
            this.getLatestAlerts();
            this.messageNotificationService.show('Alert imported successfully!', 'success');
          },
          error: (err) => {
            const mess = err?.error?.detail || 'Add alert failed';
            this.messageNotificationService.show(mess);
          },
        });

      }
      catch (error: any) {
        this.messageNotificationService.show(error.message || 'Invalid JSON file');
      }
    };

    reader.readAsText(file);
  }

  validateAlert(data: any): AlertModel {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid JSON structure');
    }

    if (data.type !== 'bundle' || !Array.isArray(data.objects)) {
      throw new Error('Uploaded file must be a STIX 2.1 bundle');
    }

    const report = data.objects.find((o: any) => o.type === 'report');

    if (!report) {
      throw new Error('STIX bundle must contain a report object');
    }

    const requiredReportFields = ['id', 'name', 'created', 'modified'];
    for (const field of requiredReportFields) {
      if (!report[field]) {
        throw new Error(`Report missing required field: ${field}`);
      }
    }

    const firstSeen = new Date(report.created);
    const lastSeen = new Date(report.modified);

    if (isNaN(firstSeen.getTime()) || isNaN(lastSeen.getTime())) {
      throw new Error('Invalid report timestamps');
    }

    return {
      type: report.type ?? 'report',

      data_hash: '',
      ioc_type: 'stix-bundle',
      ioc_value: report.name,

      first_seen: firstSeen,
      last_seen: lastSeen,

      status: 'active',

      title: report.name ?? '',
      description: report.description ?? '',

      url:
        report.external_references?.find((r: any) => r.url)?.url ?? '',

      source:
        report.external_references?.[0]?.source_name ?? 'import',

      all_ioc: data.objects,
      content_types: report.labels ?? [],
    };
  }
}
