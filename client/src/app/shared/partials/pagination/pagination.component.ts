import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
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
  protected readonly max = max;

  constructor(private appService: AppService, private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.currentPage = this.appService.page();
    this.cdr.detectChanges();
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
}
