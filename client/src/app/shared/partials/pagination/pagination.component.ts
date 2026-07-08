import { Component, effect, input, output } from '@angular/core';
import { CommonModule, NgClass, NgOptimizedImage } from '@angular/common';
import { AppService } from '../../../services/core/app/app.service';
import { max } from 'rxjs';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-pagination', templateUrl: './pagination.component.html', imports: [CommonModule, NgClass, NgOptimizedImage, TranslatePipe]
})
export class PaginationComponent {
  protected readonly max = max;

  readonly maxPagesInput = input<number | string | undefined>(1, { alias: 'maxPages' });
  readonly currentPageInput = input<number | string | undefined>(undefined, { alias: 'currentPage' });
  maxPages = 1;
  currentPage = 1;
  readonly align = input<'left' | 'center'>('center');
  readonly pageChange = output<number>();

  constructor(private appService: AppService) {
    effect(() => {
      const normalizedMaxPages = Math.max(1, Number(this.maxPagesInput() ?? 1) || 1);
      const rawCurrentPage = this.currentPageInput() ?? this.appService.page();
      const normalizedCurrentPage = Math.max(1, Number(rawCurrentPage ?? 1) || 1);

      this.maxPages = normalizedMaxPages;
      this.currentPage = Math.min(normalizedCurrentPage, normalizedMaxPages);
    });
  }

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
