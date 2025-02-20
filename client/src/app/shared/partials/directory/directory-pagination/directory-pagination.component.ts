import { Component, Input, Output, EventEmitter } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';


@Component({
  selector: 'app-directory-pagination',
  templateUrl: './directory-pagination.component.html',
  styleUrls: ['./directory-pagination.component.css'],
  imports: [CommonModule, NgOptimizedImage],
})
export class DirectoryPaginationComponent {
  @Input() page: number = 1;
  @Input() totalPages: number = 1;
  @Input() paginationNumbers: number[] = [];

  @Output() pageChange = new EventEmitter<number>();

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.pageChange.emit(newPage);
    }
  }
}
