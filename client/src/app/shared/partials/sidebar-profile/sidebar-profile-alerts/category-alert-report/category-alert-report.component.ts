import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryAlerts } from '../../../../model/alert-notification/alert.notification.model';
import { AlertAllIoc, AlertModel } from '../../../../model/company-profile/company.profile.model';
import { map, Observable } from 'rxjs';
import { AppService } from '../../../../../services/core/app/app.service';
import { search_filter_labels } from '../../../../constants/shared-enums';
import { AddCustomAlertComponent } from "../add-custom-alert/add-custom-alert.component";
import { SidebarService } from '../../../../services/sidebar.service';
import { FilterModel } from '../../../../model/filter/filter.model';
import { alert_filters } from '../../../../constants/filters';
import { FiltersComponent } from "../../../filters/filters.component";
import { ApiService } from '../../../../services/api.service';
import { MessageNotificationService } from '../../../../../services/message_notification/message-notification.service';
import { LicenseService } from '../../../../../services/licenses/licenses.service';

@Component({
  selector: 'app-category-alert-report',
  imports: [NgFor, NgIf, CommonModule, FormsModule, AddCustomAlertComponent, FiltersComponent],
  templateUrl: './category-alert-report.component.html'
})
export class CategoryAlertReportComponent implements OnInit {
  filterModel: FilterModel = alert_filters;
  alerts: CategoryAlerts[] = []
  filteredAlerts: CategoryAlerts[] = []
  searchText: string = '';
  category: string = '';
  iocTypes: Record<string, string> = {};
  showCustomAlertPopup: boolean = false;
  showEditAlertPopup: boolean = false;
  isFilterOpen$: Observable<boolean>;
  selectedAlert!: AlertModel;
  constructor(private router: Router, private route: ActivatedRoute, private appService: AppService, public sidebarService: SidebarService, private apiService: ApiService,
    private messageNotificationService: MessageNotificationService, protected licenseService: LicenseService) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }
  ngOnInit(): void {
    this.route.url.pipe(
      map(segments => {
        if (segments && segments.length > 0) {
          return segments[segments.length - 1].path;
        }
        return '';
      })
    ).subscribe(lastSegment => {
      this.category = lastSegment;
    });
    this.iocTypes = { ...search_filter_labels };
    this.alerts = this.convertAlertsList(this.appService.userProfile().alerts, this.category);
    this.filteredAlerts = this.alerts;
  }

  showAlertPopup(action: string, hash: string) {
    switch (action) {
      case 'edit':
        const alert = this.appService.userProfile().alerts.find(a => a.data_hash === hash);
        if (alert) {
          this.selectedAlert = alert;
          this.showEditAlertPopup = true;
        }
        break;

      case 'add':
        this.showCustomAlertPopup = true;
        break;

      default:
        console.warn(`Unknown action: ${action}`);
        break;
    }
  }

  cancleAlertPopup(refresh: boolean) {
    if (refresh)
      this.getLatestAlerts();
    this.filteredAlerts = this.alerts;
    this.showCustomAlertPopup = false;
    this.showEditAlertPopup = false;
  }
  deleteCustomAlert(hash: string) {
    this.apiService.post('alert/delete', hash).subscribe({
      next: () => {
        this.messageNotificationService.show("Alert deleted successfully!")
        this.getLatestAlerts();
      },
      error: (err) => {
        const mess = err?.error?.detail || 'delete alert failed'
        this.messageNotificationService.show(mess)
      },
    });
  }
  getLatestAlerts() {
    this.apiService.get<any>('profile/alerts').subscribe({
      next: response => {
        this.appService.userProfile().alerts = response
        this.alerts = this.convertAlertsList(this.appService.userProfile().alerts, this.category);
        this.filteredAlerts = this.alerts;
      }
    })
  }
  seeDetails(hash: string) {
    this.licenseService.loadLicenses().subscribe(licenses => {
      const hasEnterprise = licenses.includes('enterprise');

      if (hasEnterprise) {

        const alerts = this.appService.userProfile().alerts;
        const _alert = alerts.find(a => a.data_hash === hash);
        if (_alert?.type) {
          const value = _alert.ioc_value || '-';
          let scanType: string;
          let route: string = '/dashboard/scanner/basic-scan';

          switch (_alert.type.toLowerCase()) {
            case "advance scanning":
              scanType = "advance";
              route = "/dashboard/scanner/port-scan";
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
              } else {
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
        }
        this.apiService.post('alert/seen', [_alert]).subscribe({
          next: () => {
          },
          error: (err) => {
            console.error(err);
            alert(err?.error?.detail || 'Update failed');
          },
        });
      } else {
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
    const normalized = type.toLowerCase();
    switch (normalized) {
      case 'general':
      case 'seo scanning':
        return 'Low';

      case 'breach':
      case 'exploit':
      case 'feed':
      case 'playstore-scanning':
      case 'social-scanner':
      case 'email-breach':
      case 'stealerlogs':
        return 'Critical';

      case 'defacement':
      case 'advanced scanning':
      case 'repo scanning':
        return 'High';

      case 'social':
      case 'discussion':
        return 'Medium';

      default:
        return 'Unknown';
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
      } else {
        mergedIocMap.set(ioc.name, ioc);
      }
    }
    return Array.from(mergedIocMap.values())
      .filter(ioc => this.iocTypes.hasOwnProperty(ioc.name))
      .map(ioc => ({
        label: this.iocTypes[ioc.name],
        count: ioc.values.length
      }));
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

    if (validDates.length === 0) return '-';

    const latestDate = validDates.reduce((latest, current) =>
      current.getTime() > latest.getTime() ? current : latest
    );

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
        } else if (!existingIoc) {
          mergedIocMap.set(ioc.name, ioc);
        }
      }
      Array.from(mergedIocMap.values())
        .filter(ioc => this.iocTypes.hasOwnProperty(ioc.name))
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

    if (!range) {
      this.filteredAlerts = [...this.alerts];
      return;
    }

    const [startStr, endStr] = range.split(',');
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    this.filterByDate(startDate, endDate);
  }
  filterByDate(start: Date, end: Date) {
    const inclusiveEnd = new Date(end);
    inclusiveEnd.setHours(23, 59, 59, 999);

    this.filteredAlerts = this.alerts.filter(alert => {
      const lastSeenDate = new Date(alert.detectedOn);
      return lastSeenDate >= start && lastSeenDate <= inclusiveEnd;
    });
  }
  isDomain(value: string): boolean {
    if (!value) return false;

    value = value.replace(/https?:\/\//, "").replace(/^www\./, "");

    const domainRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})*$/;

    return domainRegex.test(value);
  }
}
