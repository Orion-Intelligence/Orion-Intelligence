import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { Case } from '../../shared/model/case-management/case.model';

@Injectable({ providedIn: 'root' })
export class CaseManagement {
  constructor(private api: ApiService) { }

  getCases(): Observable<Case[]> {
    return this.api.get<Case[]>('profile/cases');
  }

  createCase(caseData: Case): Observable<Case> {
    return this.api.post<Case>('profile/cases', caseData);
  }

  getNextCaseId(): Observable<{ nextCaseId: string }> {
    return this.api.get<{ nextCaseId: string }>('profile/cases/next-id');
  }

  validateCase(caseId: string): Observable<Case> {
    return this.api.get<Case>(`profile/cases/validate/${caseId}`);
  }

  getCaseById(caseId: string): Observable<Case> {
    return this.api.get<Case>(`profile/cases/${caseId}`);
  }

  updateCase(caseId: string, caseData: Case): Observable<Case> {
    return this.api.put<Case>(`profile/cases/${caseId}`, caseData);
  }
}