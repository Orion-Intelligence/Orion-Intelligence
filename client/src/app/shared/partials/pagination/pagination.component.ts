import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {AppService} from '../../../services/core/app.service';
import {max} from 'rxjs';
import {flush} from '@angular/core/testing';

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
    this.currentPage = Number(this.currentPage);
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

  protected readonly max = max;
}
