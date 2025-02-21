import { Injectable } from '@angular/core';
import { BehaviorSubject, } from 'rxjs';
import {DirectoryData} from '../../shared/model/directory';
import {ApiService} from '../../shared/services/api.service';

@Injectable({ providedIn: 'root' })
export class DirectoryService {
  private directoryDataSubject = new BehaviorSubject<DirectoryData | null>(null);
  directoryData$ = this.directoryDataSubject.asObservable(); // Expose as Observable

  constructor(private apiService: ApiService) {}

  setDirectoryData(data: DirectoryData): void {
    this.directoryDataSubject.next(data);
  }

  getDirectoryData(): DirectoryData | null {
    return this.directoryDataSubject.value;
  }

  reloadDirectoryData(): void {
    this.apiService.get<DirectoryData>('directory').subscribe((data) => {
      this.directoryDataSubject.next(data);
    });
  }
}
