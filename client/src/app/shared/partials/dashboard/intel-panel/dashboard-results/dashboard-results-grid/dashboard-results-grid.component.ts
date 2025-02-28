import { Component } from '@angular/core';
import { NgForOf } from '@angular/common';

@Component({
  selector: 'app-dashboard-results-grid',
  templateUrl: './dashboard-results-grid.component.html',
  imports: [
    NgForOf
  ],
  styleUrls: ['./dashboard-results-grid.component.css']
})
export class DashboardResultsGridComponent {
  expandedItems: { [key: number]: number | null } = {}; // Tracks expanded item index per column

  items = [
    ['Item 1', 'Item 2', 'Item 3'],
    ['Item 4', 'Item 5', 'Item 6'],
    ['Item 7', 'Item 8', 'Item 9']
  ];

  toggleExpand(columnIndex: number, itemIndex: number) {
    if (this.expandedItems[columnIndex] === itemIndex) {
      this.expandedItems[columnIndex] = null; // Collapse if already expanded
    } else {
      this.expandedItems[columnIndex] = itemIndex; // Expand new item
    }
  }
}
