import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared/services/api.service';
import { ArtifactReportOption, Case, CaseAnalyst, CaseRequest, CaseShareRequest, CaseShareResponse, CaseStatusUpdateRequest, CaseUpdateRequest } from '../../../../shared/model/case-management/case.model';

type ArtifactFileIntegrityResult = {
  fileId: string;
  success: boolean;
  status: 'verified' | 'failed';
};

type ArtifactFileUploadResponse = {
  files: {
    fileId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileResourceId: string;
    fileHash?: string;
    hashAlgorithm?: string;
    integrityStatus?: 'unknown' | 'verified' | 'failed';
    integrityCheckedAt?: string;
    integrityMessage?: string;
    uploadedAt?: string;
  }[];
};

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

  updateCaseStatus(caseId: string, payload: CaseStatusUpdateRequest): Observable<Case> {
    return this.api.put<Case>(`profile/cases/${caseId}/status`, payload);
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

  uploadArtifactFiles(caseId: string, artifactId: string, files: File[]): Observable<ArtifactFileUploadResponse> {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files', file);
    });

    return this.api.post<ArtifactFileUploadResponse>(`profile/cases/${caseId}/artifacts/${artifactId}/files`, formData);
  }

  verifyArtifactFile(caseId: string, artifactId: string, fileId: string): Observable<ArtifactFileIntegrityResult> {
    return this.api.post<ArtifactFileIntegrityResult>(`profile/cases/${caseId}/artifacts/${artifactId}/files/${fileId}/verify`, {});
  }

  deleteArtifactFile(caseId: string, artifactId: string, fileId: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`profile/cases/${caseId}/artifacts/${artifactId}/files/${fileId}`);
  }

  getArtifactReports(source: string, q: string = '', limit: number = 10): Observable<ArtifactReportOption[]> {
    const params = new URLSearchParams();

    params.set('source', source);
    params.set('q', q);
    params.set('limit', String(limit));

    return this.api.get<ArtifactReportOption[]>(`profile/cases/artifact-reports?${params.toString()}`);
  }

  archiveCase(caseId: string): Observable<{ success: boolean; message?: string }> {
    return this.api.put<{ success: boolean; message?: string }>(`profile/cases/${caseId}/archive`, {});
  }
}
