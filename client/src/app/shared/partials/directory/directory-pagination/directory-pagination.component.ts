import { Component } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Observable } from 'rxjs';
import { DirectoryCallbackModel } from '../../../model/directory/directory';
import { DirectoryService } from '../../../../services/directory/directory.service';

@Component({
  selector: 'app-directory-pagination',
  templateUrl: './directory-pagination.component.html',
  imports: [CommonModule, NgOptimizedImage],
})
export class DirectoryPaginationComponent {
  directoryData$: Observable<DirectoryCallbackModel | null>;
  totalPages: number = 0;
  currentPage: number = 1;
  paginationNumbers: number[] = [];

  constructor(private directoryService: DirectoryService) {
    this.directoryData$ = this.directoryService.directoryData$;

    this.directoryData$.subscribe(data => {
      if (data) {
        this.currentPage = data.page;
        this.calculatePaginationNumbers(data.total_count);
      }
    });
  }

  calculatePaginationNumbers(totalCount: number) {
    this.totalPages = Math.ceil(totalCount / 10);
    const maxPagesToShow = 5;
    const half = Math.floor(maxPagesToShow / 2);
    let startPage = Math.max(1, this.currentPage - half);
    let endPage = Math.min(this.totalPages, this.currentPage + half);

    if (endPage - startPage < maxPagesToShow - 1) {
      if (startPage === 1) {
        endPage = Math.min(maxPagesToShow, this.totalPages);
      } else {
        startPage = Math.max(1, endPage - (maxPagesToShow - 1));
      }
    }

    this.paginationNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      this.paginationNumbers.push(i);
    }
  }

  changePage(newPage: number) {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.currentPage = newPage;
    this.directoryService.reloadDirectoryData({ page: this.currentPage });
  }
}
