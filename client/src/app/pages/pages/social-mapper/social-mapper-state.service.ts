import { Injectable, signal, computed, inject } from '@angular/core';
import { TabManagerService } from './tab-manager.service';
import { FetchingStateService } from './fetching-state.service';
import { PlatformResult, Job } from '../../shared/model/social/social-scan.models';
import { ConfirmationModalData } from './components/confirmation-modal/confirmation-modal.component';
import { ManageProfilesModalData } from './components/manage-profiles-modal/manage-profiles-modal.component';
import { InfoModalData } from './components/info-modal/info-modal.component';
import { ContextMenuData } from './components/context-menu/context-menu.component';
import { NotificationData, NotificationType } from './components/notification-bar/notification-bar.component';

@Injectable({ providedIn: 'root' })
export class SocialMapperStateService {
    private tabManager = inject(TabManagerService);
    private fetchingState = inject(FetchingStateService);

    isMetadataPopupVisible = signal(false);
    selectedPlatformData = signal<PlatformResult | null>(null);
    summaryPopupData = signal<{ username: string; platforms: PlatformResult[]; email?: string; } | null>(null);
    notification = signal<NotificationData | null>(null);
    private notificationTimeout: any;
    nodeToFocus = signal<string | null>(null);
    contextMenuData = signal<ContextMenuData | null>(null);
    deleteConfirmationData = signal<ConfirmationModalData | null>(null);
    deleteUsername = signal<string | null>(null);
    infoModalData = signal<InfoModalData | null>(null);
    manageProfilesModalData = signal<ManageProfilesModalData | null>(null);
    isFollowerScanPopupVisible = signal(false);
    followerScanPopupData = signal<{ platform: PlatformResult } | null>(null);

    private activeTabState = computed(() => this.tabManager.activeTab()?.state);
    private jobs = computed(() => this.activeTabState()?.jobs() ?? []);
    private scanResults = computed(() => this.activeTabState()?.scanResults() ?? new Map<string, PlatformResult[]>());
    private networkData = computed(() => this.activeTabState()?.networkData() ?? { nodes: [], edges: [] });

    openManageProfilesModal(username: string) {
        const results = this.scanResults().get(username);
        if (!results) return;

        const centralNodeId = `user-${username}`;
        const nodesOnGraph = new Set<string>();
        this.networkData().edges.forEach(edge => {
            if (edge.from === centralNodeId && !edge.to.toString().startsWith('user-')) nodesOnGraph.add(edge.to.toString());
        });
        this.networkData().nodes.forEach(node => {
            if (node.id.toString().startsWith(`group-${username}-`) && node.groupedPlatforms) {
                node.groupedPlatforms.forEach(p => nodesOnGraph.add(this.fetchingState.getPlatformUniqueKey(p)));
            }
        });
        const platformsWithSelection = results.map(p => ({ ...p, isSelected: nodesOnGraph.has(this.fetchingState.getPlatformUniqueKey(p)) }));
        this.manageProfilesModalData.set({ username, platforms: platformsWithSelection });
    }
    
    closeManageProfilesModal() { this.manageProfilesModalData.set(null); }

    openDeleteConfirmation(username: string) {
        const job = this.jobs().find(j => j.username === username);
        this.deleteUsername.set(username);
        this.deleteConfirmationData.set({
            title: 'Delete Profile',
            message: `Are you sure you want to delete the profile for <strong class="text-indigo-400">${job?.displayName || username}</strong>? This will remove all associated data and cannot be undone.`,
            confirmText: 'Confirm Delete'
        });
        this.closeContextMenu();
    }

    closeDeleteConfirmation() { this.deleteConfirmationData.set(null); this.deleteUsername.set(null); }
    
    openInfoModal(type: 'info' | 'warning', title: string, message: string, confirmText: string = 'OK') {
        this.infoModalData.set({ type, title, message, confirmText });
    }

    closeInfoModal() { this.infoModalData.set(null); }

    openPlatformNodePopup(nodeId: string) {
        if (!nodeId.startsWith('platform-')) return;
        const key = nodeId.substring('platform-'.length);
        const [keyUsername, platformName, platformUsername] = key.split('|');
        const platformData = this.scanResults().get(keyUsername)?.find(p => p.platform === platformName && p.username === platformUsername);
        if (platformData) {
            this.selectedPlatformData.set(platformData);
            this.isMetadataPopupVisible.set(true);
        }
    }
    
    closeMetadataPopup() { this.isMetadataPopupVisible.set(false); this.selectedPlatformData.set(null); }
    closeSummaryPopup() { this.summaryPopupData.set(null); }

    openFollowerScanPopup(nodeId: string) {
        if (!nodeId.startsWith('platform-')) return;
        const key = nodeId.substring('platform-'.length);
        const [keyUsername, platformName, platformUsername] = key.split('|');
        const userResults = this.scanResults().get(keyUsername);
        const pData = userResults?.find(p => p.username === platformUsername && p.platform === platformName);
        if (pData) {
          this.followerScanPopupData.set({ platform: pData });
          this.isFollowerScanPopupVisible.set(true);
        }
    }
    
    closeFollowerScanPopup() { this.followerScanPopupData.set(null); this.isFollowerScanPopupVisible.set(false); }

    focusOnUser(username: string): void { this.nodeToFocus.set(`user-${username}`); setTimeout(() => this.nodeToFocus.set(null), 100); }
    
    closeContextMenu() { this.contextMenuData.set(null); }

    onNodeRightClicked({ nodeId, event }: { nodeId: string; event: MouseEvent }, isEditMode: boolean) {
        if (isEditMode) return;
        let type: ContextMenuData['type'] | null = null;
        const customEntities = this.activeTabState()?.customEntities() ?? [];
        
        if (nodeId.startsWith('user-')) type = 'user';
        else if (nodeId.startsWith('group-')) type = 'group';
        else if (customEntities.some(e => e.id === nodeId)) type = 'customEntity';
        else if (nodeId) type = 'platform';
        
        if (type) this.contextMenuData.set({ x: event.clientX, y: event.clientY, nodeId, type });
        else this.closeContextMenu();
    }

    showNotification(type: NotificationType) {
        clearTimeout(this.notificationTimeout);
        const notifications: Record<NotificationType, Omit<NotificationData, 'type'>> = {
          added: { message: 'User is already on the graph.', icon: 'bi bi-exclamation-triangle-fill', style: 'bg-yellow-500/90 text-slate-900 border border-yellow-400' },
          scanned: { message: 'A scan for this user already exists.', icon: 'bi bi-info-circle-fill', style: 'bg-blue-500/90 text-white border border-blue-400' },
          scanning: { message: 'A scan for this user is already in progress.', icon: 'bi bi-hourglass-split', style: 'bg-orange-500/90 text-white border border-orange-400' },
          busy: { message: 'An operation is already in progress for this user.', icon: 'bi bi-info-circle-fill', style: 'bg-cyan-500/90 text-white border border-cyan-400' }
        };
        this.notification.set({ type, ...notifications[type] });
        this.notificationTimeout = setTimeout(() => this.notification.set(null), 3000);
    }
}
