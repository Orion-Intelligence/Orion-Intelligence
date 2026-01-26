import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataSet, Edge, Network, Node } from 'vis-network/standalone';
import { fadeInDashboardItem } from '../../../../animations/dashboard.item.animation';
import { AppService } from '../../../../../services/core/app/app.service';
import { ApiService } from '../../../../services/api.service';

interface SocialTarget {
  usernames: string[];
  platform: string;
}

interface ScrapeRequest {
  usernames?: string[];
  platform?: string;
  max_followers?: number;
  max_following?: number;
  targets?: SocialTarget[];
}

interface CardData {
  platform: string;
  username: string;
  real_name: string;
  network: string;
  bio: string;
  total_posts: string;
  total_followers: string;
  total_following: string;
  weblinks: string[];
  content_type: string[];
  followers_count: number;
  following_count: number;
  mutual_count: number;
  followers: string[];
  following: string[];
  mutual_usernames: string[];
  commenters: string[];
}

interface InfluenceUser {
  username_variations: string[];
  influence_score: number;
  platforms: string[];
  connection_types: string[];
  follower_count: number;
  following_count: number;
  mutual_count: number;
  platform_breakdown: Record<string, string[]>;
}

interface IdentityGroup {
  group_id: number;
  members: { platform: string; username: string; confidence: number }[];
}

interface AnalysisData {
  summary: {
    total_cards: number;
    cards: CardData[];
  };
  following_comparison: any;
  identity_groups: {
    status: string;
    threshold: number;
    total_groups: number;
    identity_groups: IdentityGroup[];
  };
  influence_analysis: {
    status: string;
    threshold: number;
    top_influencers: InfluenceUser[];
    bridge_users: any[];
    statistics: any;
  };
}

interface ExtendedNode extends Node {
  nodeType?: string;
  platform?: string;
  connectionType?: string;
}

@Component({
  selector: 'app-social-mapper',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './social-mapper.component.html',
  styleUrls: [
    './social-mapper.component.css',
    '../../../../../../assets/styles/shared/sidebar/filters-sidebar.component.css'
  ],
  animations: [fadeInDashboardItem]
})
export class SocialMapperComponent implements OnInit {
  @ViewChild('networkContainer', { static: false }) networkContainer!: ElementRef;

  queryMode: 'single' | 'multi' = 'single';
  username = '';
  selectedPlatform = '';
  maxFollowers = 50;
  maxFollowing = 50;

  multiTargets: { username: string; platform: string }[] = [{ username: '', platform: '' }];

  platforms = [
    { value: 'instagram', label: 'Instagram', icon: 'bi-instagram' },
    { value: 'facebook', label: 'Facebook', icon: 'bi-facebook' },
    { value: 'twitter', label: 'Twitter/X', icon: 'bi-twitter-x' },
    { value: 'linkedin', label: 'LinkedIn', icon: 'bi-linkedin' },
    { value: 'tiktok', label: 'TikTok', icon: 'bi-tiktok' },
    { value: 'youtube', label: 'YouTube', icon: 'bi-youtube' },
    { value: 'reddit', label: 'Reddit', icon: 'bi-reddit' },
    { value: 'telegram', label: 'Telegram', icon: 'bi-telegram' },
    { value: 'behance', label: 'Behance', icon: 'bi-behance' }
  ];

  isLoading = false;
  hasResults = false;
  errorMessage = '';

  analysisData: AnalysisData | null = null;
  rawResults: any = null;

  network!: Network;
  nodeSet!: DataSet<ExtendedNode>;
  edgeSet!: DataSet<Edge>;

  activeTab: 'network' | 'summary' | 'influencers' | 'identities' = 'network';

  contextMenuNode: ExtendedNode | null = null;
  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;

  nodeColors: Record<string, { background: string; border: string }> = {
    target: { background: '#57A5EB', border: '#3d8fd9' },
    follower: { background: '#66BB6A', border: '#4CAF50' },
    following: { background: '#FFA726', border: '#FF9800' },
    mutual: { background: '#AB47BC', border: '#9C27B0' },
    influencer: { background: '#EF5350', border: '#E53935' },
    bridge: { background: '#26C6DA', border: '#00BCD4' }
  };

  constructor(private apiService: ApiService, protected appService: AppService) {}

  ngOnInit(): void {
    // Network will be initialized when needed
  }

  private initializeNetwork(): void {
    this.nodeSet = new DataSet<ExtendedNode>();
    this.edgeSet = new DataSet<Edge>();

    const container = this.networkContainer?.nativeElement;
    if (!container) return;

    const options = {
      nodes: {
        shape: 'dot',
        size: 20,
        font: {
          size: 12,
          color: '#ffffff'
        },
        borderWidth: 2,
        shadow: true
      },
      edges: {
        width: 1,
        color: { color: '#ffffff50' },
        arrows: { to: { enabled: true, scaleFactor: 0.5 } },
        smooth: { enabled: true, type: 'continuous', roundness: 0.5 }
      },
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -3000,
          centralGravity: 0.3,
          springLength: 150,
          springConstant: 0.04,
          damping: 0.09
        },
        stabilization: {
          enabled: true,
          iterations: 200,
          updateInterval: 25
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        hideEdgesOnDrag: true,
        navigationButtons: true,
        keyboard: true
      }
    };

    this.network = new Network(
      container,
      { nodes: this.nodeSet, edges: this.edgeSet },
      options
    );

    this.network.on('click', () => this.hideContextMenu());
    this.network.on('oncontext', (params) => {
      params.event.preventDefault();
      const nodeId = this.network.getNodeAt(params.pointer.DOM);
      if (nodeId) {
        const node = this.nodeSet.get(nodeId) as ExtendedNode;
        this.showContextMenu(params.pointer.DOM.x, params.pointer.DOM.y, node);
      }
    });
  }

  onModeChange(mode: 'single' | 'multi'): void {
    this.queryMode = mode;
    if (mode === 'multi' && this.multiTargets.length === 0) {
      this.multiTargets = [{ username: '', platform: '' }];
    }
  }

  addTarget(): void {
    this.multiTargets.push({ username: '', platform: '' });
  }

  removeTarget(index: number): void {
    if (this.multiTargets.length > 1) {
      this.multiTargets.splice(index, 1);
    }
  }

  getPlatformLabel(value: string): string {
    const platform = this.platforms.find(p => p.value === value);
    return platform ? platform.label : value;
  }

  getPlatformIcon(value: string): string {
    const platform = this.platforms.find(p => p.value === value);
    return platform ? platform.icon : 'bi-globe';
  }

  async showIntelligence(): Promise<void> {
    this.errorMessage = '';
    this.hasResults = false;

    if (this.queryMode === 'single') {
      if (!this.username.trim()) {
        this.errorMessage = 'Please enter a username';
        return;
      }
      if (!this.selectedPlatform) {
        this.errorMessage = 'Please select a platform';
        return;
      }
    } else {
      const validTargets = this.multiTargets.filter(t => t.username.trim() && t.platform);
      if (validTargets.length === 0) {
        this.errorMessage = 'Please add at least one valid target';
        return;
      }
    }

    this.isLoading = true;

    try {
      const request = this.buildRequest();
      const response = await this.apiService.post<any>('social/scrape', request).toPromise();

      if (response?.result?.status === 'success') {
        this.rawResults = response.result;
        this.analysisData = response.result.analysis;
        this.hasResults = true;
        this.renderNetworkGraph();
      } else {
        this.errorMessage = response?.result?.message || 'Failed to fetch social intelligence';
      }
    } catch (error: any) {
      console.error('API Error:', error);
      this.errorMessage = error?.message || 'Failed to connect to the API. Please ensure the service is running.';
    } finally {
      this.isLoading = false;
    }
  }

  private buildRequest(): ScrapeRequest {
    if (this.queryMode === 'single') {
      return {
        usernames: [this.username.trim()],
        platform: this.selectedPlatform,
        max_followers: this.maxFollowers,
        max_following: this.maxFollowing
      };
    } else {
      const platformGroups: Record<string, string[]> = {};

      this.multiTargets.forEach(target => {
        if (target.username.trim() && target.platform) {
          if (!platformGroups[target.platform]) {
            platformGroups[target.platform] = [];
          }
          platformGroups[target.platform].push(target.username.trim());
        }
      });

      const targets: SocialTarget[] = Object.entries(platformGroups).map(([platform, usernames]) => ({
        usernames,
        platform
      }));

      return {
        targets,
        max_followers: this.maxFollowers,
        max_following: this.maxFollowing
      };
    }
  }

  private renderNetworkGraph(): void {
    if (!this.analysisData) return;

    // Initialize network if not already done
    if (!this.network) {
      setTimeout(() => {
        this.initializeNetwork();
        this.doRenderNetwork();
      }, 100);
    } else {
      this.doRenderNetwork();
    }
  }

  private doRenderNetwork(): void {
    if (!this.analysisData) return;
    if (!this.nodeSet || !this.edgeSet) {
      this.nodeSet = new DataSet<ExtendedNode>();
      this.edgeSet = new DataSet<Edge>();
    }

    this.nodeSet.clear();
    this.edgeSet.clear();

    const nodes: ExtendedNode[] = [];
    const edges: Edge[] = [];
    const addedNodes = new Set<string>();
    let edgeId = 0;

    this.analysisData.summary.cards.forEach((card, cardIndex) => {
      const targetId = `target_${card.platform}_${card.username}`;

      if (!addedNodes.has(targetId)) {
        nodes.push({
          id: targetId,
          label: `@${card.username}\n(${card.platform})`,
          title: `${card.real_name || card.username}\nPlatform: ${card.platform}\nFollowers: ${card.total_followers}\nFollowing: ${card.total_following}`,
          color: this.nodeColors['target'],
          size: 35,
          font: { size: 14, color: '#ffffff', bold: { color: '#ffffff', size: 14, face: 'Inter', mod: 'bold' } },
          nodeType: 'target',
          platform: card.platform
        });
        addedNodes.add(targetId);
      }

      card.mutual_usernames?.forEach((mutual, i) => {
        const mutualId = `mutual_${card.platform}_${mutual}`;
        if (!addedNodes.has(mutualId)) {
          nodes.push({
            id: mutualId,
            label: `@${mutual}`,
            title: `Mutual connection on ${card.platform}`,
            color: this.nodeColors['mutual'],
            size: 22,
            nodeType: 'mutual',
            platform: card.platform,
            connectionType: 'mutual'
          });
          addedNodes.add(mutualId);
        }
        edges.push({
          id: `edge_${edgeId++}`,
          from: targetId,
          to: mutualId,
          color: { color: '#AB47BC' },
          width: 2,
          dashes: false
        });
      });

      card.followers?.slice(0, 15).forEach((follower, i) => {
        const followerId = `follower_${card.platform}_${follower}`;
        if (!addedNodes.has(followerId)) {
          nodes.push({
            id: followerId,
            label: `@${follower}`,
            title: `Follower on ${card.platform}`,
            color: this.nodeColors['follower'],
            size: 16,
            nodeType: 'follower',
            platform: card.platform,
            connectionType: 'follower'
          });
          addedNodes.add(followerId);
        }
        edges.push({
          id: `edge_${edgeId++}`,
          from: followerId,
          to: targetId,
          color: { color: '#66BB6A80' },
          width: 1
        });
      });

      card.following?.slice(0, 15).forEach((following, i) => {
        const followingId = `following_${card.platform}_${following}`;
        if (!addedNodes.has(followingId)) {
          nodes.push({
            id: followingId,
            label: `@${following}`,
            title: `Following on ${card.platform}`,
            color: this.nodeColors['following'],
            size: 16,
            nodeType: 'following',
            platform: card.platform,
            connectionType: 'following'
          });
          addedNodes.add(followingId);
        }
        edges.push({
          id: `edge_${edgeId++}`,
          from: targetId,
          to: followingId,
          color: { color: '#FFA72680' },
          width: 1
        });
      });
    });

    if (this.analysisData.influence_analysis?.top_influencers) {
      this.analysisData.influence_analysis.top_influencers.slice(0, 5).forEach(influencer => {
        influencer.username_variations.forEach(username => {
          const matchingNodes = nodes.filter(n =>
            n.label?.toLowerCase().includes(username.toLowerCase())
          );
          matchingNodes.forEach(node => {
            node.color = this.nodeColors['influencer'];
            node.size = 25;
            node.title = `Top Influencer\nScore: ${influencer.influence_score}\n${node.title}`;
          });
        });
      });
    }

    if (this.analysisData.influence_analysis?.bridge_users) {
      this.analysisData.influence_analysis.bridge_users.forEach(bridge => {
        bridge.username_variations.forEach((username: string) => {
          const matchingNodes = nodes.filter(n =>
            n.label?.toLowerCase().includes(username.toLowerCase())
          );
          matchingNodes.forEach(node => {
            node.color = this.nodeColors['bridge'];
            node.size = 24;
            node.title = `Bridge User (Multi-platform)\n${node.title}`;
          });
        });
      });
    }

    this.nodeSet.add(nodes);
    this.edgeSet.add(edges);

    if (this.network) {
      this.network.once('stabilizationIterationsDone', () => {
        this.network.fit({ animation: true });
      });
    }
  }

  private showContextMenu(x: number, y: number, node: ExtendedNode): void {
    this.contextMenuNode = node;
    this.contextMenuX = x;
    this.contextMenuY = y;
    this.contextMenuVisible = true;
  }

  hideContextMenu(): void {
    this.contextMenuVisible = false;
    this.contextMenuNode = null;
  }

  copyUsername(): void {
    if (this.contextMenuNode?.label) {
      const username = this.contextMenuNode.label.split('\n')[0].replace('@', '');
      navigator.clipboard.writeText(username);
    }
    this.hideContextMenu();
  }

  searchUser(): void {
    if (this.contextMenuNode?.label) {
      const username = this.contextMenuNode.label.split('\n')[0].replace('@', '');
      const platform = this.contextMenuNode.platform || 'instagram';

      this.queryMode = 'single';
      this.username = username;
      this.selectedPlatform = platform;
      this.showIntelligence();
    }
    this.hideContextMenu();
  }

  setActiveTab(tab: 'network' | 'summary' | 'influencers' | 'identities'): void {
    this.activeTab = tab;
    if (tab === 'network' && this.analysisData) {
      setTimeout(() => {
        if (!this.network || !this.networkContainer?.nativeElement?.children?.length) {
          this.initializeNetwork();
          this.doRenderNetwork();
        } else {
          this.network.fit({ animation: true });
        }
      }, 100);
    }
  }

  resetForm(): void {
    this.username = '';
    this.selectedPlatform = '';
    this.multiTargets = [{ username: '', platform: '' }];
    this.maxFollowers = 50;
    this.maxFollowing = 50;
    this.hasResults = false;
    this.analysisData = null;
    this.rawResults = null;
    this.errorMessage = '';
    this.nodeSet?.clear();
    this.edgeSet?.clear();
  }

  getConnectionTypeClass(type: string): string {
    const classes: Record<string, string> = {
      follower: 'badge-follower',
      following: 'badge-following',
      mutual: 'badge-mutual'
    };
    return classes[type] || 'badge-default';
  }

  togglePhysics(enabled: boolean): void {
    this.network?.setOptions({ physics: { enabled } });
  }

  fitNetwork(): void {
    this.network?.fit({ animation: true });
  }
}
