import { Component, Input, Output, EventEmitter } from '@angular/core';
import {CommonModule} from '@angular/common';


@Component({
  selector: 'app-directory-pagination',
  templateUrl: './directory-pagination.component.html',
  styleUrls: ['./directory-pagination.component.css'],
  imports: [CommonModule],
})
export class DirectoryPaginationComponent {
  //
  // changePage(newPage: number) {
  //   if (newPage >= 1 && newPage <= this.totalPages) {
  //     this.pageChange.emit(newPage);
  //   }
  // }
}
