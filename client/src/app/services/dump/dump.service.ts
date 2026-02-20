import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { DumpCallbackModel } from '../../shared/model/dump/dump.mode';
import { ListService } from '../../shared/directive/base.listing.directive';
@Injectable({ providedIn: 'root' })
export class DumpService implements ListService<DumpCallbackModel> {
  filterModel = { source: 'all', group: 'all', parsed_status: 'all' };

  private dumpDataSubject = new BehaviorSubject<DumpCallbackModel | null>(null);
  private currentPageSubject = new BehaviorSubject<number>(1);
  private filterOpenSubject = new BehaviorSubject<boolean>(false);

  dumpData$ = this.dumpDataSubject.asObservable();
  currentPage$ = this.currentPageSubject.asObservable();
  isFilterOpen$ = this.filterOpenSubject.asObservable();

  constructor(private apiService: ApiService) { }

  setDumpData(data: DumpCallbackModel): void {
    this.dumpDataSubject.next(data);
  }

  reloadDumpData(params?: any): void {
    const page = params?.page ?? this.currentPageSubject.getValue();
    this.apiService.get<DumpCallbackModel>('dumps', { params: { ...(params || {}), page } }).subscribe((data) => {
      this.dumpDataSubject.next(data);
    });
  }

  getCurrentPage(): number {
    return this.currentPageSubject.getValue();
  }

  setCurrentPage(page: number): void {
    if (page > 0) {
      this.currentPageSubject.next(page);
    }
  }

  toggleFilter(open: boolean): void {
    this.filterOpenSubject.next(open);
  }

  reload(params?: any): void {
    this.reloadDumpData(params);
  }
}
