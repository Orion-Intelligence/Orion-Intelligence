import { Component, Input } from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-dashboard-pagination',
  templateUrl: './dashboard-pagination.component.html',
  styleUrls: ['./dashboard-pagination.component.css'],
  imports: [
    CommonModule
  ]
})
export class DashboardPaginationComponent {
  @Input() currentPage: number = 1;
  @Input() maxPagination: number = 1;
  @Input() query: string = '';
  @Input() safeSearch: string = '';
  @Input() searchType: string = '';

  get pages(): number[] {
    return Array.from({ length: this.maxPagination }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.maxPagination) {
      console.log(`Navigating to page ${page}`);
      // Implement actual navigation logic
    }
  }
}
