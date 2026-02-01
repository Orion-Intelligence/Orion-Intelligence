import { Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize, expand, switchMap, takeWhile } from 'rxjs/operators';
import { EMPTY, timer } from 'rxjs';
import { DataSet, Edge, Network, Node } from 'vis-network/standalone';
import { fadeInDashboardItem } from '../../../../animations/dashboard.item.animation';
import { AppService } from '../../../../../services/core/app/app.service';
import { ApiService } from '../../../../services/api.service';

interface SocialTarget {
  usernames: string[];
  platform: string;
  max_followers: number;
  max_following: number;
}

interface ScrapeRequest {
  targets: SocialTarget[];
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

interface SocialMapperResponse {
  status?: string;
  result?: {
    status?: string;
    progress?: number;
    step?: string;
    analysis?: AnalysisData;
    message?: string;
    scrape_results?: any[];
    total_scraped?: number;
  };
  progress?: number;
  step?: string;
}

interface LoadingStatus {
  platform: string;
  username: string;
  progress: number;
}

@Component({
  selector: 'app-social-mapper',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './social-mapper.component.html',
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
    { value: 'behance', label: 'Behance', icon: 'bi-behance' }
  ];

  isLoading = false;
  hasResults = false;
  isFetched = false;
  hasError = false;
  errorMessage = '';

  progress = signal(0);
  currentStep = '';
  loadingStatuses: LoadingStatus[] = [];

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

  constructor(
    private apiService: ApiService,
    protected appService: AppService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParams;
    if (queryParams['mode']) {
      this.queryMode = queryParams['mode'] as 'single' | 'multi';

      if (this.queryMode === 'single' && queryParams['username']) {
        this.username = queryParams['username'];
        this.selectedPlatform = queryParams['platform'] || '';
        this.maxFollowers = Number(queryParams['maxFollowers']) || 50;
        this.maxFollowing = Number(queryParams['maxFollowing']) || 50;
        this.load();
      } else if (this.queryMode === 'multi' && queryParams['targets']) {
        try {
          this.multiTargets = JSON.parse(queryParams['targets']);
          this.maxFollowers = Number(queryParams['maxFollowers']) || 50;
          this.maxFollowing = Number(queryParams['maxFollowing']) || 50;
          this.load();
        } catch (e) {
          console.error('Failed to parse targets from query params', e);
          this.isLoading = false;
        }
      }
    }
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
        keyboard: {
          enabled: true,
          bindToWindow: false
        }
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

  showIntelligence(): void {
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

    const queryParams: any = {
      mode: this.queryMode,
      maxFollowers: this.maxFollowers,
      maxFollowing: this.maxFollowing
    };

    if (this.queryMode === 'single') {
      queryParams.username = this.username.trim();
      queryParams.platform = this.selectedPlatform;
    } else {
      queryParams.targets = JSON.stringify(
        this.multiTargets.filter(t => t.username.trim() && t.platform)
      );
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    }).then(() => {
      this.load();
    });
  }

  private load(): void {
    this.isLoading = true;
    this.isFetched = false;
    this.hasError = false;
    this.errorMessage = '';
    this.analysisData = null;
    this.rawResults = null;
    this.progress.set(0);
    this.currentStep = '';
    this.activeTab = 'network';
    this.initializeLoadingStatuses();

    const request = this.buildRequest();

    this.apiService.post<SocialMapperResponse>('social/scrape', request)
      .pipe(
        expand(res => (
          res?.status === 'pending' ||
          res?.result?.status === 'busy' ||
          res?.result?.status === 'pending'
        ) ? timer(5000).pipe(
          switchMap(() => this.apiService.post<SocialMapperResponse>('social/scrape', request))
        )
          : EMPTY
        ),
        takeWhile(res =>
          res?.status === 'pending' ||
          res?.result?.status === 'busy' ||
          res?.result?.status === 'pending',
          true
        ),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res: SocialMapperResponse) => {
          if (res?.result?.status === 'busy' ||
            res?.result?.status === 'pending' ||
            res?.status === 'pending') {
            const p = res?.result?.progress ?? res?.progress;
            if (typeof p === 'number' && !Number.isNaN(p)) {
              this.progress.set(p);
              this.updateLoadingStatuses(p);
            }
            const st = res?.result?.step ?? res?.step;
            if (typeof st === 'string' && st) {
              this.currentStep = st;
            }
            return;
          }

          this.isFetched = true;

          const safe = !!(res && res.result && res.result.analysis);
          if (!safe) {
            this.hasError = true;
            this.errorMessage = res?.result?.message || 'No data received from social mapper.';
            return;
          }

          this.rawResults = res.result!;
          this.analysisData = res.result!.analysis || null;
          this.hasResults = true;
          this.isLoading = false;

          if (this.activeTab === 'network') {
            setTimeout(() => {
              this.renderNetworkGraph();
            }, 500);
          }
        },
        error: (err) => {
          this.isFetched = true;
          this.hasError = true;
          this.errorMessage = (err && (err.error?.detail || err.message)) ||
            'Failed to fetch social intelligence.';
        }
      });
  }

  private initializeLoadingStatuses(): void {
    this.loadingStatuses = [];

    if (this.queryMode === 'single') {
      this.loadingStatuses.push({
        platform: this.selectedPlatform,
        username: this.username.trim(),
        progress: 0
      });
    } else {
      const validTargets = this.multiTargets.filter(t => t.username.trim() && t.platform);
      validTargets.forEach(target => {
        this.loadingStatuses.push({
          platform: target.platform,
          username: target.username.trim(),
          progress: 0
        });
      });
    }
  }

  private updateLoadingStatuses(overallProgress: number): void {
    this.loadingStatuses.forEach(status => {
      status.progress = overallProgress;
    });
  }

  private buildRequest(): ScrapeRequest {
    const maxF = Number(this.maxFollowers);
    const maxFl = Number(this.maxFollowing);
    const targets: SocialTarget[] = [];

    if (this.queryMode === 'single') {
      targets.push({
        platform: this.selectedPlatform,
        usernames: [this.username.trim()],
        max_followers: maxF,
        max_following: maxFl
      });
    } else {
      const platformGroups: Record<string, string[]> = {};

      this.multiTargets.forEach(t => {
        if (t.username.trim() && t.platform) {
          if (!platformGroups[t.platform]) {
            platformGroups[t.platform] = [];
          }
          platformGroups[t.platform].push(t.username.trim());
        }
      });

      Object.keys(platformGroups).forEach(platform => {
        targets.push({
          platform,
          usernames: platformGroups[platform],
          max_followers: maxF,
          max_following: maxFl
        });
      });
    }

    return { targets };
  }

  retry(): void {
    this.load();
  }

  onSearchSubmit(): void {
    this.showIntelligence();
  }

  private renderNetworkGraph(): void {
    if (!this.analysisData) return;

    if (this.network) {
      this.network.destroy();
      this.network = null as any;
    }

    this.initializeNetwork();
    this.doRenderNetwork();
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

    this.analysisData.summary.cards.forEach((card) => {
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

      card.mutual_usernames?.forEach((mutual) => {
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

      card.followers?.forEach((follower) => {
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

      card.following?.forEach((following) => {
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

    if (this.analysisData.summary.cards.length > 1) {
      const usernameOccurrences = new Map<string, { count: number; platforms: Set<string> }>();

      this.analysisData.summary.cards.forEach(card => {
        const allUsernames = [
          ...(card.followers || []),
          ...(card.following || []),
          ...(card.mutual_usernames || [])
        ];

        allUsernames.forEach(username => {
          const lowerUsername = username.toLowerCase();
          if (!usernameOccurrences.has(lowerUsername)) {
            usernameOccurrences.set(lowerUsername, { count: 0, platforms: new Set() });
          }
          const entry = usernameOccurrences.get(lowerUsername)!;
          entry.count++;
          entry.platforms.add(card.platform);
        });
      });

      usernameOccurrences.forEach((data, username) => {
        if (data.count > 1 || data.platforms.size > 1) {
          const matchingNodes = nodes.filter(n =>
            n.label?.toLowerCase().replace('@', '').trim() === username
          );
          matchingNodes.forEach(node => {
            if (node.nodeType !== 'target' && node.color !== this.nodeColors['influencer'] && node.color !== this.nodeColors['bridge']) {
              node.color = { background: '#E91E63', border: '#C2185B' };
              node.size = 20;
              node.title = `Cross-Profile Connection\nAppears in ${data.count} connections\n${node.title}`;
            }
          });
        }
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
    this.hasError = false;
    this.isFetched = false;
    this.progress.set(0);
    this.currentStep = '';
    this.loadingStatuses = [];
    this.nodeSet?.clear();
    this.edgeSet?.clear();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
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
