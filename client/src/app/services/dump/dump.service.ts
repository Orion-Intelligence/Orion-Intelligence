import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import {DumpCallbackModel} from '../../shared/model/dump/dump.mode';

@Injectable({ providedIn: 'root' })
export class DumpService {
  private dumpDataSubject = new BehaviorSubject<DumpCallbackModel | null>(null);
  private currentPageSubject = new BehaviorSubject<number>(1);
  private filters: { [key: string]: string } = {};
  private filterOpenSubject = new BehaviorSubject<boolean>(false);

  dumpData$ = this.dumpDataSubject.asObservable();
  currentPage$ = this.currentPageSubject.asObservable();
  isFilterOpen$ = this.filterOpenSubject.asObservable();

  filterModel = {
    source: 'all',
    group: 'all',
    parsed_status: 'all'
  };

  constructor(private apiService: ApiService) {}

  setDumpData(data: DumpCallbackModel): void {
    this.dumpDataSubject.next(data);
  }

  reloadDumpData(params?: any): void {
    this.apiService.get<DumpCallbackModel>('dumps', { params }).subscribe((data) => {
      this.dumpDataSubject.next(data);
    });
  }

  setSelectedFilters(filters: { [key: string]: string }) {
    this.filters = filters;
  }

  getSelectedFilters(): { [key: string]: string } {
    return this.filters;
  }

  setCurrentPage(page: number): void {
    if (page > 0) {
      this.currentPageSubject.next(page);
    }
  }

  toggleFilter(open: boolean): void {
    this.filterOpenSubject.next(open);
  }

  applyFilters(newFilters: any): void {
    this.filterModel = newFilters;
    this.reloadDumpData({ ...newFilters, page: this.currentPageSubject.getValue() });
  }

  resetFilters(): void {
    this.filterModel = {
      source: 'all',
      group: 'all',
      parsed_status: 'all'
    };
    this.reloadDumpData({ page: 1 });
  }
}
