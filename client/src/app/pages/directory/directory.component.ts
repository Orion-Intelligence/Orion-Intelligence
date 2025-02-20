import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {ToolbarComponent} from '../../shared/partials/toolbar/toolbar.component';
import {FiltersComponent} from '../../shared/partials/directory/directory-filters/directory-filters.component';
import {HeaderComponent} from '../../shared/partials/header/header.component';
import {FooterComponent} from '../../shared/partials/footer/footer.component';
import {DirectoryListComponent} from '../../shared/partials/directory/directory-list/directory-list.component';
import {DirectoryPaginationComponent} from '../../shared/partials/directory/directory-pagination/directory-pagination.component';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-directory',
  templateUrl: './directory.component.html',
  imports: [
    ToolbarComponent,
    FiltersComponent,
    DirectoryListComponent,
    FooterComponent,
    DirectoryPaginationComponent,
    NgOptimizedImage,
  ],
  styleUrls: ['./directory.component.css']
})
export class DirectoryComponent implements OnInit {
  directoryData: any[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  paginationNumbers: number[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      console.log('Resolved Data:', data['directory']);
      this.directoryData = data['directory'];
      this.totalPages = Math.ceil(this.directoryData.length / 10);
      this.paginationNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    });
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
  }
}
