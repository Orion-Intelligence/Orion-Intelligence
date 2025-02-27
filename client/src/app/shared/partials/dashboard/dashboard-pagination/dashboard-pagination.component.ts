import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  @Input() maxPages: number = 1;
  @Input() searchQuery: string = '';
  @Input() safeSearch: boolean = false;
  @Input() searchType: string = '';

  @Output() pageChange = new EventEmitter<number>();

  onPageChange(page: number) {
    this.pageChange.emit(page);
  }
}
