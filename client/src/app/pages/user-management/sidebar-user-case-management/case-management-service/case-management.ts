import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared/services/api.service';
import { ArtifactReportOption, Case, CaseAnalyst, CaseRequest, CaseShareRequest, CaseShareResponse, CaseUpdateRequest } from '../../../../shared/model/case-management/case.model';

type ArtifactFileUploadResponse = { fileName: string; fileType: string; fileSize: number; fileResourceId: string };

@Injectable({ providedIn: 'root' })
export class CaseManagement {
  constructor(private api: ApiService) { }

  getCases(archived = false): Observable<Case[]> {
    return this.api.get<Case[]>(`profile/cases?archived=${archived}`);
  }

  createCase(caseData: CaseRequest): Observable<Case> {
    return this.api.post<Case>('profile/cases', caseData);
  }

  getNextCaseId(): Observable<{ nextCaseId: string }> {
    return this.api.get<{ nextCaseId: string }>('profile/cases/next-id');
  }

  getAnalysts(): Observable<CaseAnalyst[]> {
    return this.api.get<CaseAnalyst[]>('profile/cases/analysts');
  }

  getCaseById(caseId: string): Observable<Case> {
    return this.api.get<Case>(`profile/cases/${caseId}`);
  }

  updateCase(caseId: string, caseData: CaseUpdateRequest): Observable<Case> {
    return this.api.put<Case>(`profile/cases/${caseId}`, caseData);
  }

  deleteCase(caseId: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`profile/cases/${caseId}`);
  }

  createCaseShare(caseId: string, payload: CaseShareRequest): Observable<CaseShareResponse> {
    return this.api.post<CaseShareResponse>(`profile/cases/${caseId}/shares`, payload);
  }

  revokeCaseShares(caseId: string): Observable<{ success: boolean; revokedCount: number }> {
    return this.api.delete<{ success: boolean; revokedCount: number }>(`profile/cases/${caseId}/shares`);
  }

  uploadArtifactFile(caseId: string, artifactId: string, file: File): Observable<ArtifactFileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.api.post<ArtifactFileUploadResponse>(`profile/cases/${caseId}/artifacts/${artifactId}/file`, formData);
  }

  deleteArtifactFile(caseId: string, artifactId: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`profile/cases/${caseId}/artifacts/${artifactId}/file`);
  }

  getArtifactReports(source: string, q: string = '', limit: number = 10): Observable<ArtifactReportOption[]> {
    const params = new URLSearchParams();

    params.set('source', source);
    params.set('q', q);
    params.set('limit', String(limit));

    return this.api.get<ArtifactReportOption[]>(`profile/cases/artifact-reports?${params.toString()}`);
  }

  archiveCase(caseId: string): Observable<{ success: boolean; message?: string }> {
    return this.api.put<{ success: boolean; message?: string }>(`profile/cases/${caseId}/archive`,
      {});
  }

}
