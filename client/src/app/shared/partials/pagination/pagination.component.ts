import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {AppService} from '../../../services/core/app.service';
import {max} from 'rxjs';

@Component({
  selector: 'app-pagination', templateUrl: './pagination.component.html', imports: [CommonModule, NgOptimizedImage]
})
export class PaginationComponent implements OnInit {
  @Input() maxPages: number = 1;
  @Input() currentPage: number = 1;

  @Output() pageChange = new EventEmitter<number>();

  constructor(private appService: AppService) {
  }

  ngOnInit(): void {
    this.currentPage = this.appService.page();
  }

  getPageRange(): number[] {
    const totalVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(totalVisible / 2));
    let end = start + totalVisible - 1;

    if (end > this.maxPages) {
      end = this.maxPages;
      start = Math.max(1, end - totalVisible + 1);
    }

    const pageNumbers: number[] = [];
    for (let i = start; i <= end; i++) {
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

  protected readonly max = max;
}
