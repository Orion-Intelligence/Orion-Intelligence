import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DirectoryCallbackModel } from '../../shared/model/directory/directory.model';
import { ApiService } from '../../shared/services/api.service';

@Injectable({ providedIn: 'root' })
export class DirectoryService {
  private directoryDataSubject = new BehaviorSubject<DirectoryCallbackModel | null>(null);
  private currentPageSubject = new BehaviorSubject<number>(1);

  directoryData$ = this.directoryDataSubject.asObservable();
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
}
