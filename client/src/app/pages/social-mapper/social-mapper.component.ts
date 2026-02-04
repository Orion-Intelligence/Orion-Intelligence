
import { Component, ChangeDetectionStrategy, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NetworkGraphComponent } from './network-graph/network-graph.component';
import { MetadataPopupComponent } from './metadata-popup/metadata-popup.component';
import { ProfileSummaryPopupComponent } from './profile-summary-popup/profile-summary-popup.component';
import { NetworkData, Job, PlatformResult } from '../../shared/model/social/social-scan.models';
import { SocialScanService } from './social-scan.service';

@Component({
  selector: 'app-social-mapper',
  templateUrl: './social-mapper.component.html',
  styleUrls: ['./social-mapper.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NetworkGraphComponent, MetadataPopupComponent, ProfileSummaryPopupComponent]
})
export class SocialMapperComponent {
  private scanService = inject(SocialScanService);
  private destroyRef = inject(DestroyRef);

  searchTerm = signal('');
  sidebarSearchTerm = signal('');
  jobs = signal<Job[]>([]);
  networkData = signal<NetworkData>({ nodes: [], edges: [] });
  scanResults = signal<Map<string, PlatformResult[]>>(new Map());
  activeUsernames = signal(new Set<string>());

  isModalVisible = signal(false);
  modalResults = signal<{ username: string, platforms: PlatformResult[] }>({ username: '', platforms: [] });

  isMetadataPopupVisible = signal(false);
  selectedPlatformData = signal<PlatformResult | null>(null);

  isSummaryPopupVisible = signal(false);
  summaryPopupData = signal<{ username: string; platforms: PlatformResult[]; email?: string; } | null>(null);

  showAlreadyAddedNotification = signal(false);
  showAlreadyScannedNotification = signal(false);
  private notificationTimeout: any;

  nodeToFocus = signal<string | null>(null);

  contextMenu = signal({
    visible: false,
    x: 0,
    y: 0,
    username: null as string | null,
  });

  deleteConfirmation = signal({
    visible: false,
    username: null as string | null,
  });

  isSearchDisabled = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (term.length === 0) return true;
    return this.jobs().some(job => job.username.toLowerCase() === term);
  });

  filteredJobs = computed(() => {
    const term = this.sidebarSearchTerm().toLowerCase();
    if (!term) {
      return this.jobs();
    }
    return this.jobs().filter(job => job.username.toLowerCase().includes(term));
  });

  onSearchInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.searchTerm.set(inputElement.value);
  }

  onSidebarSearchInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.sidebarSearchTerm.set(inputElement.value);
  }

  triggerScan() {
    const username = this.searchTerm().trim();
    if (!username) return;

    if (this.jobs().some(job => job.username.toLowerCase() === username.toLowerCase())) {
        this.showNotification('scanned');
        return;
    }

    const newJob: Job = {
      id: self.crypto.randomUUID(),
      username: username,
      status: 'in_progress',
      progress: 0,
      step: 'Queued...'
    };

    this.jobs.update(currentJobs => [newJob, ...currentJobs]);
    this.searchTerm.set('');
    this.runScan(newJob);
  }
  
  handleCompletedJobClick(job: Job) {
    if (job.status !== 'completed' || this.activeUsernames().has(job.username)) {
      return;
    }
    this.openModalForJob(job.username);
  }

  focusOnUser(username: string): void {
    this.nodeToFocus.set(`user-${username}`);
    setTimeout(() => this.nodeToFocus.set(null), 100);
  }

  openDeleteConfirmation(username: string) {
    this.deleteConfirmation.set({ visible: true, username: username });
    this.closeContextMenu();
  }

  closeDeleteConfirmation() {
    this.deleteConfirmation.set({ visible: false, username: null });
  }

  confirmDeletion() {
    const usernameToDelete = this.deleteConfirmation().username;
    if (usernameToDelete) {
      this.jobs.update(currentJobs => currentJobs.filter(job => job.username.toLowerCase() !== usernameToDelete.toLowerCase()));

      this.networkData.update(currentData => {
          const centralNodeId = `user-${usernameToDelete}`;
          const nodesToRemove = new Set<string | number>();
          currentData.nodes.forEach(node => {
            if (node.id === centralNodeId || node.id.toString().startsWith(`${usernameToDelete}-`)) {
              nodesToRemove.add(node.id);
            }
          });
          
          return {
              nodes: currentData.nodes.filter(n => !nodesToRemove.has(n.id)),
              edges: currentData.edges.filter(e => e.from !== centralNodeId)
          };
      });

      this.activeUsernames.update(set => {
          set.delete(usernameToDelete);
          return new Set(set);
      });

      this.scanResults.update(results => {
          results.delete(usernameToDelete);
          return new Map(results);
      });
    }
    this.closeDeleteConfirmation();
  }

  private showNotification(type: 'added' | 'scanned') {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    
    this.showAlreadyAddedNotification.set(type === 'added');
    this.showAlreadyScannedNotification.set(type === 'scanned');

    this.notificationTimeout = setTimeout(() => {
        this.showAlreadyAddedNotification.set(false);
        this.showAlreadyScannedNotification.set(false);
    }, 3000);
  }

  private runScan(job: Job) {
    this.scanService.performScan(job.username)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          if (event.type === 'progress') {
            const progressUpdate = event.payload;
            this.jobs.update(jobs => jobs.map(j =>
              j.id === job.id
                ? { ...j, ...progressUpdate }
                : j
            ));
          } else if (event.type === 'complete') {
            const finalPlatforms = event.payload;
            this.scanResults.update(results => results.set(job.username, finalPlatforms));
            this.jobs.update(jobs => jobs.map(j =>
              j.id === job.id
                ? { ...j, status: 'completed', progress: 100, step: 'Completed' }
                : j
            ));
          }
        },
        error: (err) => {
          console.error('Scan failed:', err);
          this.jobs.update(jobs => jobs.map(j =>
            j.id === job.id
              ? { ...j, status: 'failed', step: 'Scan failed' }
              : j
          ));
        }
      });
  }
  
  onNodeClicked(nodeId: string) {
    if (!nodeId.startsWith('user-')) return;
    const username = nodeId.replace('user-', '');
    const userPlatforms = this.scanResults().get(username);
    if (userPlatforms) {
      const email = userPlatforms.find(p => p.email)?.email;
      this.summaryPopupData.set({ username, platforms: userPlatforms, email: email });
      this.isSummaryPopupVisible.set(true);
    }
  }
  
  openModalForJob(username: string) {
    const results = this.scanResults().get(username);
    if (!results) return;

    const currentGraphNodes = new Set(
      this.networkData().nodes
        .filter(n => n.id.toString().startsWith(`${username}-`))
        .map(n => n.label)
    );

    const platformsWithSelection = results.map(p => ({
      ...p,
      isSelected: currentGraphNodes.has(p.platform)
    }));

    this.modalResults.set({ username, platforms: platformsWithSelection });
    this.isModalVisible.set(true);
  }

  closeModal() {
    this.isModalVisible.set(false);
  }
  
  onPlatformNodeClicked(nodeId: string) {
    const [username, platformName] = nodeId.split('-');
    const userResults = this.scanResults().get(username);
    if (!userResults) return;

    const platformData = userResults.find(p => p.platform === platformName);
    if (platformData) {
      this.selectedPlatformData.set(platformData);
      this.isMetadataPopupVisible.set(true);
    }
  }

  closeMetadataPopup() {
    this.isMetadataPopupVisible.set(false);
    this.selectedPlatformData.set(null);
  }
  
  closeSummaryPopup() {
    this.isSummaryPopupVisible.set(false);
    this.summaryPopupData.set(null);
  }

  updateGraphFromModal() {
    const { username, platforms } = this.modalResults();
    const centralNodeId = `user-${username}`;
    const selectedPlatforms = platforms.filter(p => p.isSelected);

    if (selectedPlatforms.length === 0) {
        this.networkData.update(currentData => ({
            nodes: currentData.nodes.filter(n => n.id !== centralNodeId && !n.id.toString().startsWith(`${username}-`)),
            edges: currentData.edges.filter(e => e.from !== centralNodeId)
        }));
        this.activeUsernames.update(set => {
            set.delete(username);
            return new Set(set);
        });
        this.closeModal();
        return;
    }

    this.networkData.update(currentData => {
        let newNodes = [...currentData.nodes];
        let newEdges = [...currentData.edges];

        if (!currentData.nodes.some(n => n.id === centralNodeId)) {
            newNodes.push({
                id: centralNodeId,
                label: username,
                shape: 'circularImage',
                image: `https://i.pravatar.cc/150?u=${username}`,
                size: 40,
                font: { color: '#ffffff' },
                color: { 
                    border: '#818cf8', 
                    background: '#3730a3',
                    highlight: { border: '#c4b5fd', background: '#4f46e5' },
                    hover: { border: '#a5b4fc', background: '#4338ca' }
                },
                title: `<b>${username}</b><br>Click to view profile summary`,
                shadow: { enabled: true, color: 'rgba(99, 102, 241, 0.6)', size: 25, x: 0, y: 0 }
            });
            this.activeUsernames.update(set => set.add(username));
        }

        const selectedPlatformNames = new Set(selectedPlatforms.map(p => p.platform));
        const existingPlatformNodes = currentData.nodes.filter(n => n.id.toString().startsWith(`${username}-`));
        const existingPlatformNames = new Set(existingPlatformNodes.map(n => n.label));

        const platformsToRemove = existingPlatformNodes.filter(node => !selectedPlatformNames.has(node.label));
        const nodeIdsToRemove = new Set(platformsToRemove.map(node => node.id));
        newNodes = newNodes.filter(node => !nodeIdsToRemove.has(node.id));
        newEdges = newEdges.filter(edge => !nodeIdsToRemove.has(edge.to));

        selectedPlatforms.forEach(platform => {
            if (!existingPlatformNames.has(platform.platform)) {
                const platformNodeId = `${username}-${platform.platform}`;
                newNodes.push({
                    id: platformNodeId,
                    label: platform.platform,
                    shape: 'circularImage',
                    image: `https://logo.clearbit.com/${platform.url.split('/')[2]}`,
                    size: 25,
                    font: { color: '#e5e7eb' },
                    color: { 
                        border: '#14b8a6',
                        background: '#0f766e',
                        highlight: { border: '#5eead4', background: '#0d9488' },
                        hover: { border: '#2dd4bf', background: '#0f766e' }
                    },
                    title: `<b>${platform.platform}</b><br>Click for details`
                });
                newEdges.push({ from: centralNodeId, to: platformNodeId });
            }
        });
          
        return { nodes: newNodes, edges: newEdges };
    });

    this.closeModal();
  }

  togglePlatformSelection(platformName: string) {
    this.modalResults.update(current => {
      const updatedPlatforms = current.platforms.map(p => 
        p.platform === platformName ? { ...p, isSelected: !p.isSelected } : p
      );
      return { ...current, platforms: updatedPlatforms };
    });
  }

  onNodeRightClicked({ nodeId, event }: { nodeId: string; event: MouseEvent }) {
    if (nodeId.startsWith('user-')) {
        const username = nodeId.replace('user-', '');
        this.contextMenu.set({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            username: username,
        });
    } else {
        this.closeContextMenu();
    }
  }

  closeContextMenu() {
      this.contextMenu.set({ visible: false, x: 0, y: 0, username: null });
  }

  removeAllPlatformNodes() {
    const username = this.contextMenu().username;
    if (!username) {
        this.closeContextMenu();
        return;
    }

    this.networkData.update(currentData => ({
        nodes: currentData.nodes.filter(n => !n.id.toString().startsWith(`${username}-`)),
        edges: currentData.edges.filter(e => e.from !== `user-${username}`)
    }));

    this.activeUsernames.update(set => {
        set.delete(username);
        return new Set(set);
    });
    this.closeContextMenu();
  }


  getJobClasses(job: Job): string {
    const baseClasses = 'p-3 rounded-lg relative border bg-slate-800/50 transition-colors';
    
    if (job.status === 'completed') {
      const isActive = this.activeUsernames().has(job.username);
       return `${baseClasses} border-slate-700 ${!isActive ? 'cursor-pointer hover:border-indigo-500' : ''}`;
    }
    if (job.status === 'in_progress') {
      return `${baseClasses} border-indigo-500/50`;
    }
    if (job.status === 'failed') {
      return `${baseClasses} border-red-500/50`;
    }
    return baseClasses;
  }

  trackByJobId(index: number, job: Job): string {
    return job.id;
  }

  trackByPlatformName(index: number, platform: PlatformResult): string {
    return platform.platform;
  }
}
