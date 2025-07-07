import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {DatePipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {DefacementResultItem} from '../../../../model/results/defacement/defacement.param.model';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {ScrollService} from '../../../../services/scroll.service';

@Component({
  selector: 'app-dashboard-result-list',
  standalone: true, imports: [NgIf, NgForOf, RouterLink, NgClass, DatePipe],
  templateUrl: './dashboard-result-list.component.html'
})
export class DashboardResultListComponent implements OnInit, AfterViewInit {
  @Input() searchResults: DefacementResultItem[] = [];
  currentUrl = '';
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  queryParams: { ci: string; } | undefined;

  constructor(private router: Router, private route: ActivatedRoute, protected scrollService: ScrollService) {
  }

  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];
    if (this.currentUrl.includes('consolidated')) {
      this.currentUrl = this.currentUrl.replace("/all","/defacement");
    }

    this.route.queryParams.subscribe(_ => {
      this.queryParams = {ci: 'defacement'};
    });
  }

  ngAfterViewInit() {
    this.scrollService.scrollToSavedPosition();
  }

  sortTable(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.searchResults.sort((a, b) => {
      let valueA = this.getColumnValue(a, column);
      let valueB = this.getColumnValue(b, column);

      if (column === 'm_date_of_leak') {
        if (!valueA || valueA === 'N/A') return this.sortDirection === 'asc' ? 1 : -1;
        if (!valueB || valueB === 'N/A') return this.sortDirection === 'asc' ? -1 : 1;
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      } else if (Array.isArray(valueA)) {
        valueA = valueA.join(', ');
        valueB = valueB.join(', ');
      } else if (column === 'm_web_url') {
        valueA = valueA[0] || '';
        valueB = valueB[0] || '';
      }

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
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
}
