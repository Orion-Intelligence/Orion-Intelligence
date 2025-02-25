import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {filters} from './filters';


@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private searchQuerySubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchQuerySubject.asObservable();

  filters: filters = new filters();
  currentPage: string = '';

  constructor() {}

  setSearchQuery(query: string) {
    this.searchQuerySubject.next(query);
  }

  setCurrentPage(page: string) {
    this.currentPage = page;
  }

  setSafeSearch(value: boolean) {
    this.filters.safeSearch = value;
  }
}
