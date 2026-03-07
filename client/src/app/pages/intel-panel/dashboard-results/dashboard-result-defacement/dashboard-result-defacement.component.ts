import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ScrollService } from '../../../../shared/services/scroll.service';
import { DefacementResultItem } from '../../../../shared/model/results/defacement/defacement.callback.model';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
import { AppService } from '../../../../services/core/app/app.service';
import { LicenseService } from '../../../../services/licenses/licenses.service';
@Component({
  selector: 'app-dashboard-result-defacement',
  standalone: true, imports: [RouterLink, NgClass, DatePipe, CommonModule, TooltipDirective],
  templateUrl: './dashboard-result-defacement.component.html',
  animations: [fadeInDashboardItem],
})
export class DashboardResultDefacementComponent implements OnInit, AfterViewInit {
  currentUrl = '';
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  queryParams: { ci: string; } | undefined;
  isCollapsed = true;

  @Input() searchResults: DefacementResultItem[] = [];
  @Input() isExpandAble: boolean = false;
  @Input() isList: boolean = true;
  @Input() isLoading: boolean = true;

  constructor(private activatedRoute: ActivatedRoute, public appService: AppService, private router: Router, private route: ActivatedRoute, protected scrollService: ScrollService, protected licenseService: LicenseService) {
  }

  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];
    if (this.currentUrl.includes('consolidated')) {
      this.currentUrl = this.currentUrl.replace("/all", "/defacement");
    }
    this.route.queryParams.subscribe(_ => {
      this.queryParams = { ci: 'defacement' };
    });
  }

  ngAfterViewInit() {
    this.scrollService.scrollToSavedPosition();
  }

  sortTable(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    }
    else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.searchResults.sort((a, b) => {
      let valueA = this.getColumnValue(a, column);
      let valueB = this.getColumnValue(b, column);
      if (column === 'm_leak_date') {
        if (!valueA || valueA === 'N/A') {
          return this.sortDirection === 'asc' ? 1 : -1;
        }
        if (!valueB || valueB === 'N/A') {
          return this.sortDirection === 'asc' ? -1 : 1;
        }
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      }
      else if (Array.isArray(valueA)) {
        valueA = valueA.join(', ');
        valueB = valueB.join(', ');
      }
      else if (column === 'm_web_url') {
        valueA = valueA[0] || '';
        valueB = valueB[0] || '';
      }
      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  getColumnValue(item: any, column: string) {
    return item[column];
  }

  getSortClass(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc';
    }
    return 'sort-default';
  }

  isMobileMode(): boolean {
    return this.activatedRoute.snapshot.queryParamMap.get('mode') === 'free';
  }
}
