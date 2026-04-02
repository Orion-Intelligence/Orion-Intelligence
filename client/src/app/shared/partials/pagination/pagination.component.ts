import { ChangeDetectorRef, Component, OnInit, effect, input, output } from '@angular/core';
import { CommonModule, NgClass, NgOptimizedImage } from '@angular/common';
import { AppService } from '../../../services/core/app/app.service';
import { max } from 'rxjs';
@Component({
  selector: 'app-pagination', templateUrl: './pagination.component.html', imports: [CommonModule, NgClass, NgOptimizedImage]
})
export class PaginationComponent implements OnInit {
  protected readonly max = max;

  readonly maxPagesInput = input(1, { alias: 'maxPages' });
  readonly currentPageInput = input(1, { alias: 'currentPage' });
  maxPages = 1;
  currentPage = 1;
  readonly align = input<'left' | 'center'>('center');
  readonly pageChange = output<number>();

  constructor(private appService: AppService, private cdr: ChangeDetectorRef) {
    effect(() => {
      this.maxPages = this.maxPagesInput();
      this.currentPage = this.currentPageInput();
    });
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
