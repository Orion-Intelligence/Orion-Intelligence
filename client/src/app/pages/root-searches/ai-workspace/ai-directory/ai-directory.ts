import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { NexusChatService } from '../nexus-chat.service';
import { NexusWorkspaceFileNode, NexusWorkspaceImportResponse } from '../../../../shared/model/nexus/ai-chat-session.model';

type AiDirectoryViewMode = 'chat' | 'directory' | 'split';

@Component({
  selector: 'app-ai-directory',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-directory.html',
})
export class AiDirectory implements OnChanges, OnDestroy {
  private workspaceStatusRequest?: Subscription;
  private readonly workspaceFileChunkSize = 1000;
  private activeWorkspaceSessionId: string | null = null;
  private lastImportRequestId: string | null = null;

  workspaceStatusMessage = '';
  workspaceStatusType: 'idle' | 'loading' | 'approved' | 'infected' | 'failed' = 'idle';
  workspaceTree: NexusWorkspaceFileNode | null = null;
  selectedWorkspaceFilePath = '';
  selectedWorkspaceFileContent = '';
  selectedWorkspaceFileHasMore = false;
  selectedWorkspaceFileNextStartLine: number | null = null;
  selectedWorkspaceFileLoading = false;

  @Input() sessionId: string | null = null;
  @Input() importRequest: { requestId: string; sessionId: string; repoUrl: string } | null = null;
  @Input() viewMode: AiDirectoryViewMode = 'directory';

  @Output() workspaceApproved = new EventEmitter<void>();

  constructor(private readonly nexusChatService: NexusChatService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['importRequest'] && this.importRequest) {
      if (this.importRequest.requestId === this.lastImportRequestId) {
        return;
      }

      this.lastImportRequestId = this.importRequest.requestId;
      this.activeWorkspaceSessionId = this.importRequest.sessionId;

      this.importGithubRepo(this.importRequest.repoUrl,
        this.importRequest.sessionId);

      return;
    }

    if (changes['sessionId']) {
      this.workspaceStatusRequest?.unsubscribe();
      this.resetWorkspace(false);

      if (!this.sessionId) {
        this.activeWorkspaceSessionId = null;
        return;
      }

      this.activeWorkspaceSessionId = this.sessionId;
      this.loadExistingWorkspaceStatus();
    }
  }

  ngOnDestroy(): void {
    this.workspaceStatusRequest?.unsubscribe();
  }

  importGithubRepo(repoUrl: string, sessionId = this.sessionId): void {
    if (!sessionId || !repoUrl.trim() || this.workspaceStatusType === 'loading') {
      return;
    }

    this.activeWorkspaceSessionId = sessionId;

    this.workspaceStatusRequest?.unsubscribe();

    this.workspaceStatusType = 'loading';
    this.workspaceStatusMessage = 'Repository import started. Downloading and scanning...';
    this.resetWorkspace(true);

    this.nexusChatService.importGithubRepo(sessionId, repoUrl.trim()).subscribe({
      next: (response) => {
        const result = response.result || response;

        if (result.status === 'processing') {
          this.workspaceStatusMessage = result.message || 'Repository is being processed...';
          this.pollWorkspaceStatus(sessionId);
          return;
        }

        this.handleWorkspaceImportResult(response);
      },
      error: (error) => {
        this.workspaceStatusType = 'failed';
        this.workspaceStatusMessage = this.getApiErrorMessage(error);
      },
    });
  }

  loadWorkspaceTree(path = '', targetNode?: NexusWorkspaceFileNode): void {
    const sessionId = this.activeWorkspaceSessionId || this.sessionId;

    if (!sessionId) {
      return;
    }

    if (targetNode) {
      targetNode.loading = true;
    }

    this.nexusChatService.getWorkspaceTree(sessionId, path).subscribe({
      next: (response: any) => {
        const result = response.result || response;
        const loadedNode = result.tree;

        if (!loadedNode) {
          console.error('Workspace tree failed:', response);

          if (targetNode) {
            targetNode.loading = false;
            return;
          }

          this.workspaceTree = null;
          this.workspaceStatusType = 'failed';
          this.workspaceStatusMessage =
            result.message || 'Repository scanned, but file tree was not found.';
          return;
        }

        if (targetNode) {
          targetNode.children = loadedNode.children || [];
          targetNode.children_loaded = true;
          targetNode.expanded = true;
          targetNode.loading = false;
          return;
        }

        this.workspaceTree = {
          ...loadedNode,
          expanded: true,
          children_loaded: true,
          children: loadedNode.children || [],
        };

        this.workspaceStatusType = 'approved';
        this.workspaceStatusMessage = 'Repository loaded successfully.';
      },
      error: (error) => {
        console.error('Workspace tree API error:', error);

        if (targetNode) {
          targetNode.loading = false;
          return;
        }

        const detail = error?.error?.detail?.detail || error?.error?.detail || error?.error;

        if (detail?.status === 'not_found') {
          this.workspaceTree = null;
          this.workspaceStatusType = 'idle';
          this.workspaceStatusMessage = '';
          return;
        }

        this.workspaceTree = null;
        this.workspaceStatusType = 'failed';
        this.workspaceStatusMessage = 'Unable to load repository file tree.';
      },
    });
  }

  toggleWorkspaceDirectory(node: NexusWorkspaceFileNode): void {
    if (node.type !== 'directory') {
      return;
    }

    if (node.children_loaded) {
      node.expanded = !node.expanded;
      return;
    }

    this.loadWorkspaceTree(node.path, node);
  }

  openWorkspaceFile(node: NexusWorkspaceFileNode): void {
    const sessionId = this.activeWorkspaceSessionId || this.sessionId;

    if (!sessionId || node.type !== 'file') {
      return;
    }

    this.selectedWorkspaceFilePath = node.path;
    this.selectedWorkspaceFileContent = '';
    this.selectedWorkspaceFileHasMore = false;
    this.selectedWorkspaceFileNextStartLine = null;
    this.selectedWorkspaceFileLoading = false;

    this.loadWorkspaceFileChunk(node.path, 1, true);
  }

  loadWorkspaceFileChunk(path: string, startLine = 1, reset = false): void {
    const sessionId = this.activeWorkspaceSessionId || this.sessionId;

    if (!sessionId || this.selectedWorkspaceFileLoading) {
      return;
    }

    this.selectedWorkspaceFileLoading = true;

    this.nexusChatService
      .getWorkspaceFile(sessionId, path, startLine, this.workspaceFileChunkSize)
      .subscribe({
        next: (response) => {
          const content = response.content || '';

          if (reset) {
            this.selectedWorkspaceFileContent = content;
          }
          else {
            this.selectedWorkspaceFileContent += content;
          }

          this.selectedWorkspaceFileHasMore = response.has_more;
          this.selectedWorkspaceFileNextStartLine = response.next_start_line || null;
          this.selectedWorkspaceFileLoading = false;
        },
        error: (error) => {
          this.selectedWorkspaceFileLoading = false;

          if (reset) {
            this.selectedWorkspaceFileContent =
              this.getApiErrorMessage(error) || 'Unable to read file.';
          }
        },
      });
  }

  onWorkspaceFileScroll(event: Event): void {
    const element = event.target as HTMLElement;

    const nearBottom =
      element.scrollTop + element.clientHeight >= element.scrollHeight - 200;

    if (
      nearBottom &&
      this.selectedWorkspaceFileHasMore &&
      this.selectedWorkspaceFileNextStartLine &&
      !this.selectedWorkspaceFileLoading &&
      this.selectedWorkspaceFilePath
    ) {
      this.loadWorkspaceFileChunk(this.selectedWorkspaceFilePath,
        this.selectedWorkspaceFileNextStartLine,
        false);
    }
  }

  private pollWorkspaceStatus(sessionId: string): void {
    this.workspaceStatusRequest?.unsubscribe();

    this.workspaceStatusRequest = interval(3000).subscribe(() => {
      this.nexusChatService.getWorkspaceStatus(sessionId).subscribe({
        next: (response) => {
          const result = response.result || response;

          if (result.status === 'processing') {
            this.workspaceStatusMessage = result.message || 'Repository is still processing...';
            return;
          }

          this.workspaceStatusRequest?.unsubscribe();
          this.handleWorkspaceImportResult(response);
        },
        error: (error) => {
          this.workspaceStatusRequest?.unsubscribe();
          this.workspaceStatusType = 'failed';
          this.workspaceStatusMessage = this.getApiErrorMessage(error);
        },
      });
    });
  }

  private handleWorkspaceImportResult(response: NexusWorkspaceImportResponse): void {
    const result = response.result || response;

    if (result.status === 'approved') {
      this.workspaceStatusType = 'approved';
      this.workspaceStatusMessage = result.message || 'Repository imported and scanned successfully.';
      this.loadWorkspaceTree();
      this.workspaceApproved.emit();
      return;
    }

    if (result.status === 'infected') {
      this.workspaceStatusType = 'infected';
      this.workspaceStatusMessage = result.message || 'Repository blocked because a threat was detected.';
      return;
    }

    this.workspaceStatusType = 'failed';
    this.workspaceStatusMessage = result.message || result.error || 'Repository import failed.';
  }

  private resetWorkspace(keepStatus: boolean): void {
    if (!keepStatus) {
      this.workspaceStatusMessage = '';
      this.workspaceStatusType = 'idle';
    }

    this.workspaceTree = null;
    this.selectedWorkspaceFilePath = '';
    this.selectedWorkspaceFileContent = '';
    this.selectedWorkspaceFileHasMore = false;
    this.selectedWorkspaceFileNextStartLine = null;
    this.selectedWorkspaceFileLoading = false;
  }

  private getApiErrorMessage(error: any): string {
    const detail = error?.error?.detail ?? error?.error;

    if (typeof detail === 'string') {
      return detail;
    }

    return detail?.message || detail?.error || error?.message || 'Request failed.';
  }

  private loadExistingWorkspaceStatus(): void {
    const sessionId = this.activeWorkspaceSessionId || this.sessionId;

    if (!sessionId) {
      return;
    }

    this.nexusChatService.getWorkspaceStatus(sessionId).subscribe({
      next: (response) => {
        const result = response.result || response;

        if (result.status === 'approved') {
          this.workspaceStatusType = 'approved';
          this.workspaceStatusMessage = result.message || 'Repository is ready.';
          this.loadWorkspaceTree();
          return;
        }

        if (result.status === 'processing') {
          this.workspaceStatusType = 'loading';
          this.workspaceStatusMessage = result.message || 'Repository is still processing...';
          this.pollWorkspaceStatus(sessionId);
          return;
        }

        if (result.status === 'infected') {
          this.workspaceStatusType = 'infected';
          this.workspaceStatusMessage = result.message || 'Repository blocked because a threat was detected.';
          return;
        }

        this.workspaceStatusType = 'idle';
        this.workspaceStatusMessage = '';
        this.workspaceTree = null;
      },
      error: () => {
        this.workspaceStatusType = 'idle';
        this.workspaceStatusMessage = '';
        this.workspaceTree = null;
      },
    });
  }
}
