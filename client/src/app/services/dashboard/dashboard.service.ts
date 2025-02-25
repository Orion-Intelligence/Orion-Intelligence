import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { filters } from './filters';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private searchQuerySubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchQuerySubject.asObservable();

  private currentPageSubject = new BehaviorSubject<string>('');
  currentPage$ = this.currentPageSubject.asObservable();

  filters: filters = new filters();

  constructor() {}

  setSearchQuery(query: string) {
    this.searchQuerySubject.next(query);
  }

  setCurrentPage(page: string) {
    this.currentPageSubject.next(page);
  }
  
  updatePage(page: string) {
    this.setCurrentPage(page);
  }
}
