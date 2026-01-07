import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuditLogCallbackModel } from '../../shared/model/auditlog/auditlog.model';
import { ApiService } from '../../shared/services/api.service';
import { ListService } from '../../shared/directive/base.listing.directive';

@Injectable({ providedIn: 'root' })
export class AuditlogService implements ListService<AuditLogCallbackModel> {
  private auditDataSubject = new BehaviorSubject<AuditLogCallbackModel | null>(null);
  private currentPageSubject = new BehaviorSubject<number>(1);

  auditData$ = this.auditDataSubject.asObservable();
  currentPage$ = this.currentPageSubject.asObservable();

  constructor(private apiService: ApiService) { }

  reloadAuditData(params?: any): void {
    this.apiService.post<AuditLogCallbackModel>('audit/logs', params).subscribe((data) => {
      this.auditDataSubject.next(data);
    });
  }

  setCurrentPage(page: number): void {
    if (page > 0) {
      this.currentPageSubject.next(page);
    }
  }
  reload(params?: any): void {
    this.apiService.post<AuditLogCallbackModel>('audit/logs', params).subscribe(data => {
      this.auditDataSubject.next(data);
    });
  }
}
