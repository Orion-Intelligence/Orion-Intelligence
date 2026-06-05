import { ArtifactReportOption, Case, CaseAnalyst, CaseArtifact, CaseClosure, CaseEntity, CaseLink, CaseTask } from '../../../../../shared/model/case-management/case.model';

export type CaseDetailsEditSection = 'caseDetails' | 'primaryEntity' | 'relatedEntities' | 'artifacts' | 'tasks' | 'linkedCases';

export abstract class CaseDetailsStore {
  abstract caseData: Case | null;
  abstract editedCase: Case | null;
  abstract isEditing: boolean;
  abstract activeEditSection: CaseDetailsEditSection | null;
  abstract isAddingRelatedEntity: boolean;
  abstract isAddingArtifact: boolean;
  abstract isAddingTask: boolean;
  abstract isAddingLinkedCase: boolean;
  abstract isClosingCase: boolean;
  abstract newRelatedEntity: CaseEntity | null;
  abstract newArtifact: CaseArtifact | null;
  abstract newTask: CaseTask | null;
  abstract newLinkedCase: CaseLink | null;
  abstract newClosure: CaseClosure | null;
  abstract analysts: CaseAnalyst[];
  abstract accessibleCases: Case[];

  abstract enableEditing(section: CaseDetailsEditSection): void;
  abstract cancelEditing(): void;
  abstract openAddRelatedEntity(): void;
  abstract removeRelatedEntity(index: number): void;
  abstract saveRelatedEntities(): void;
  abstract saveNewRelatedEntity(): void;
  abstract openAddArtifact(): void;
  abstract saveArtifacts(): void;
  abstract removeArtifact(index: number): void;
  abstract uploadArtifactFiles(artifact: CaseArtifact, fileInput: HTMLInputElement): void;
  abstract viewArtifactFile(artifact: CaseArtifact, fileId: string): void;
  abstract downloadArtifactFile(artifact: CaseArtifact, fileId: string): void;
  abstract deleteArtifactFile(artifact: CaseArtifact, fileId: string): void;
  abstract setPendingNewArtifactFiles(fileInput: HTMLInputElement): void;
  abstract getPendingNewArtifactFileNames(): string;
  abstract saveNewArtifact(): void;
  abstract openAddTask(): void;
  abstract saveTasks(): void;
  abstract removeTask(index: number): void;
  abstract saveNewTask(): void;
  abstract openAddLinkedCase(): void;
  abstract saveLinkedCases(): void;
  abstract removeLinkedCase(index: number): void;
  abstract saveNewLinkedCase(): void;
  abstract goToLinkedCase(caseId: string): void;
  abstract openCloseCase(): void;
  abstract openEditClosure(): void;
  abstract saveClosure(): void;
  abstract cancelSectionMode(): void;
  abstract loadArtifactReports(source: string, q?: string): void;
  abstract scheduleArtifactReportSearch(artifact: CaseArtifact): void;
  abstract onArtifactReportSelected(artifact: CaseArtifact, reportId: string): void;
  abstract artifactReports: ArtifactReportOption[];
  abstract isArtifactReportsLoading: boolean;
  abstract viewArtifactReport(artifact: CaseArtifact): void;
}
