import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryAlerts } from '../../../../model/alert-notification/alert.notification.model';
import { AlertAllIoc, AlertModel } from '../../../../model/company-profile/company.profile.model';
import { map } from 'rxjs';
import { AppService } from '../../../../../services/core/app/app.service';
import { search_filter_labels } from '../../../../constants/shared-enums';

@Component({
  selector: 'app-category-alert-report',
  imports: [NgFor, NgIf, CommonModule, FormsModule],
  templateUrl: './category-alert-report.component.html'
})
export class CategoryAlertReportComponent implements OnInit {
  alerts: CategoryAlerts[] = []
  searchText: string = '';
  category: string = '';
  iocTypes: Record<string, string> = {};
  constructor(public router: Router, public route: ActivatedRoute, public appService: AppService) { }
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
  }

  addCustomAlert() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl(`dashboard/profile/addcustomalert`);
  }
  seeDetails(hash: string) {
    this.router.navigate([`/dashboard/${this.category}/all/${hash}`]);
  }
  alertRist(type: string): string {
    if (type == "breach")
      return "cretical";
    return "low";
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
      risk: 'High',
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


}
