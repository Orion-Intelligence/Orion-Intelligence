import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  imports: [CommonModule, NgOptimizedImage]
})
export class PaginationComponent {
  @Input() maxPages: number = 1;
  @Input() currentPage: number = 1;

  @Output() pageChange = new EventEmitter<number>();



  getPageRange(): number[] {
    const leftBound = Math.max(1, this.currentPage - 2);
    const rightBound = Math.min(this.maxPages, this.currentPage + 2);
    const pageNumbers: number[] = [];

    for (let i = leftBound; i <= rightBound; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.maxPages) {
      this.currentPage = page;
      this.pageChange.emit(this.currentPage);
    }
  }
}
