import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DirectoryCallbackModel } from '../../shared/model/callback/directory';
import { ApiService } from '../../shared/services/api.service';

@Injectable({ providedIn: 'root' })
export class DirectoryService {
  private directoryDataSubject = new BehaviorSubject<DirectoryCallbackModel | null>(null);
  directoryData$ = this.directoryDataSubject.asObservable();

  private currentPageSubject = new BehaviorSubject<number>(1); // Default page is 1
  currentPage$ = this.currentPageSubject.asObservable();

  constructor(private apiService: ApiService) {}

  setDirectoryData(data: DirectoryCallbackModel): void {
    this.directoryDataSubject.next(data);
  }

  reloadDirectoryData(params?: any): void {
    this.apiService.get<DirectoryCallbackModel>('directory', { params }).subscribe((data) => {
      this.directoryDataSubject.next(data);
    });
  }

  setCurrentPage(page: number): void {
    if (page > 0) {
      this.currentPageSubject.next(page);
    }
  }

  getCurrentPage(): number {
    return this.currentPageSubject.getValue();
  }
}
