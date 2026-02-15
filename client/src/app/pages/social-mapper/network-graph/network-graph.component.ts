import { Component, ChangeDetectionStrategy, input, viewChild, ElementRef, effect, signal, OnDestroy, output, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Network, Options, Position } from 'vis-network';
import { DataSet } from 'vis-data';
import { NetworkData, PlatformResult } from '../../../shared/model/social/social-scan.models';
import { FetchingStateService } from '../services/fetching-state.service';
import { SocialMapperStateService } from '../services/social-mapper-state.service';

@Component({
  selector: 'app-network-graph',
  templateUrl: './network-graph.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  host: {
    '[class.manipulation-active]': 'isManipulating()',
  }
})
export class NetworkGraphComponent implements OnInit, OnDestroy {
  data = input.required<NetworkData>();
  focusNodeId = input<string | null>(null);
  editMode = input(false);
  physicsEnabled = input(false);
  searchTerm = input<string>('');
  nodesWithFollows = input<Set<string>>(new Set());

  container = viewChild.required<ElementRef>('networkContainer');

  nodeClicked = output<string>();
  platformNodeClicked = output<string>();
  groupClicked = output<{ nodeId: string, position: Position }>();
  dragStart = output<void>();
  zoom = output<void>();
  edgeAdded = output<{ from: string, to: string }>();
  edgeDeleted = output<{ edges: string[] }>();

  private fetchingState = inject(FetchingStateService);
  public state = inject(SocialMapperStateService);
  private networkInstance = signal<Network | null>(null);
  private visData = {
    nodes: new DataSet<any>(),
    edges: new DataSet<any>(),
  };

  deleteButtonState = signal({
    visible: false,
    x: 0,
    y: 0,
    edgeId: null as string | null
  });
  private hideButtonTimeout: any;
  isManipulating = signal(false);

  private animationFrameId: number | null = null;
  private animationStartTime: number | null = null;

  iconOverlayNodes = signal<{nodeId: string, x: number, y: number}[]>([]);
  private readonly minZoomScale = 0.35;
  private minZoomLockPosition: Position | null = null;

  private normalizeSearchValue(value: string): string
  {
    return value.trim().toLowerCase().replace(/^@+/, '').replace(/[\s_-]+/g, '');
  }

  loadingNodeIds = computed(() => {
    const loadingIds = new Set<string>();

    const statesToProcess = [
      this.fetchingState.profile(),
      this.fetchingState.posts(),
      this.fetchingState.platformImages(),
      this.fetchingState.followers(),
      this.fetchingState.following(),
    ];

    for (const state of statesToProcess) {
      if (state) {
        for (const key in state) {
          if (state[key]) {
            loadingIds.add(key);
            if (key.startsWith('platform-')) {
              const username = key.substring('platform-'.length).split('|')[0];
              loadingIds.add(`user-${username}`);
            }
          }
        }
      }
    }

    const imageState = this.fetchingState.userImages();
    if (imageState) {
      for (const key in imageState) {
        if (imageState[key]) {
            loadingIds.add(`user-${key}`);
        }
      }
    }

    return loadingIds;
  });

  constructor() {
    effect(() => {
      const networkData = this.data();
      const containerEl = this.container()?.nativeElement;

      if (containerEl && !this.networkInstance()) {
          this.createNetwork(containerEl, this.visData);
      }

      this.updateNetworkData(networkData);
    });

    effect(() => {
      const nodeId = this.focusNodeId();
      const network = this.networkInstance();
      if (nodeId && network) {
        network.focus(nodeId, {
          scale: 1.2,
          animation: {
            duration: 1000,
            easingFunction: 'easeInOutQuad'
          }
        });
      }
    });

    effect(() => {
      const network = this.networkInstance();
      if (!network) {
        return;
      }
      if (this.editMode()) {
        network.addEdgeMode();
      } else {
        network.disableEditMode();
        network.unselectAll();
        this.hideDeleteButton(true);
        this.isManipulating.set(false);
      }
    });

    effect(() => {
      const network = this.networkInstance();
      const enabled = this.physicsEnabled();
      if (network) {
        network.setOptions({ physics: { enabled: enabled } });
      }
    });

    effect(() => {
      const term = this.searchTerm();
      const network = this.networkInstance();
      if (!network || this.visData.nodes.length === 0) {
        return;
      }

      const originalNodes = this.data().nodes;
      const updates: any[] = [];
      const rawTerm = term ?? '';
      const lowerCaseTerm = rawTerm.toLowerCase();
      const normalizedTerm = this.normalizeSearchValue(rawTerm);
      const matchedUserNodeIds = new Set<string>();

      network.unselectAll();

      if (normalizedTerm) {
        for (const candidate of originalNodes) {
          const candidateId = candidate.id.toString();

          if (candidateId.startsWith('platform-')) {
            const rawKey = candidateId.substring('platform-'.length);
            const parts = rawKey.split('|');

            if (parts.length >= 3) {
              const keyUsername = parts[0];
              const platformName = parts[1];
              const platformUsername = parts.slice(2).join('|');
              const normalizedPlatformName = this.normalizeSearchValue(platformName);
              const normalizedPlatformUsername = this.normalizeSearchValue(platformUsername);

              if (normalizedPlatformName.includes(normalizedTerm) || normalizedPlatformUsername.includes(normalizedTerm)) {
                matchedUserNodeIds.add(`user-${keyUsername}`);
              }
            }
          } else if (candidateId.startsWith('group-') && candidate.groupedPlatforms) {
            const groupBody = candidateId.substring('group-'.length);
            const lastDashIndex = groupBody.lastIndexOf('-');
            const keyUsername = lastDashIndex > 0 ? groupBody.substring(0, lastDashIndex) : groupBody;
            const hasGroupedMatch = candidate.groupedPlatforms.some((platform: PlatformResult) => {
              const normalizedPlatformName = this.normalizeSearchValue(platform.platform ?? '');
              const normalizedPlatformUsername = this.normalizeSearchValue(platform.username ?? '');
              return normalizedPlatformName.includes(normalizedTerm) || normalizedPlatformUsername.includes(normalizedTerm);
            });

            if (hasGroupedMatch) {
              matchedUserNodeIds.add(`user-${keyUsername}`);
            }
          }
        }
      }

      if (!lowerCaseTerm.trim()) {
        originalNodes.forEach(originalNode => {
          updates.push({
            id: originalNode.id,
            color: originalNode.color,
            borderWidth: originalNode.borderWidth
          });
        });
      } else {
        this.visData.nodes.forEach((node: any) => {
          const originalNode = originalNodes.find(n => n.id === node.id);
          if (!originalNode) {
            return;
          }

          let isMatch = false;
          const nodeLabel = typeof node.label === 'string' ? node.label : '';
          const nodeTitle = typeof node.title === 'string' ? node.title : '';
          const nodeId = typeof node.id === 'string' ? node.id : '';
          const normalizedLabel = this.normalizeSearchValue(nodeLabel);
          const normalizedTitle = this.normalizeSearchValue(nodeTitle);

          if (nodeLabel.toLowerCase().includes(lowerCaseTerm) || nodeTitle.toLowerCase().includes(lowerCaseTerm)) {
            isMatch = true;
          }

          if (!isMatch && normalizedTerm && (normalizedLabel.includes(normalizedTerm) || normalizedTitle.includes(normalizedTerm))) {
            isMatch = true;
          }

          if (!isMatch && nodeId.startsWith('user-') && normalizedTerm) {
            const profileNameRaw = nodeId.substring('user-'.length);
            const normalizedProfileName = this.normalizeSearchValue(profileNameRaw);
            if (normalizedProfileName.includes(normalizedTerm)) {
              isMatch = true;
            }
          }

          if (!isMatch && nodeId.startsWith('user-') && matchedUserNodeIds.has(nodeId)) {
            isMatch = true;
          }

          if (!isMatch && nodeId.startsWith('user-') && normalizedTerm) {
            const profileNameRaw = nodeId.substring('user-'.length);
            for (const candidate of originalNodes) {
              const candidateId = candidate.id.toString();
              if (!candidateId.startsWith(`platform-${profileNameRaw}|`)) {
                continue;
              }
              const parts = candidateId.split('|');
              const platformUsername = parts.length > 2 ? this.normalizeSearchValue(parts[2]) : '';
              if (platformUsername.includes(normalizedTerm)) {
                isMatch = true;
                break;
              }
            }
          }

          if (!isMatch && nodeId.startsWith('user-') && normalizedTerm) {
            const profileNameRaw = nodeId.substring('user-'.length);
            for (const candidate of originalNodes) {
              const candidateId = candidate.id.toString();
              if (!candidateId.startsWith(`group-${profileNameRaw}-`) || !candidate.groupedPlatforms) {
                continue;
              }
              const hasGroupedMatch = candidate.groupedPlatforms.some((platform: PlatformResult) => {
                const normalizedPlatformUsername = this.normalizeSearchValue(platform.username ?? '');
                const normalizedPlatformName = this.normalizeSearchValue(platform.platform ?? '');
                return normalizedPlatformUsername.includes(normalizedTerm) || normalizedPlatformName.includes(normalizedTerm);
              });
              if (hasGroupedMatch) {
                isMatch = true;
                break;
              }
            }
          }

          if (!isMatch && originalNode.groupedPlatforms) {
            isMatch = originalNode.groupedPlatforms.some((p: PlatformResult) => {
              const platformName = p.platform ? p.platform.toLowerCase() : '';
              const platformUser = p.username ? p.username.toLowerCase() : '';
              const normalizedPlatformName = this.normalizeSearchValue(p.platform ?? '');
              const normalizedPlatformUser = this.normalizeSearchValue(p.username ?? '');
              return platformName.includes(lowerCaseTerm) || platformUser.includes(lowerCaseTerm) || normalizedPlatformName.includes(normalizedTerm) || normalizedPlatformUser.includes(normalizedTerm);
            });
          }

          if (isMatch) {
            updates.push({
              id: node.id,
              color: { ...originalNode.color, border: '#facc15' },
              borderWidth: originalNode.borderWidthSelected || (originalNode.borderWidth || 2) + 2,
            });
          } else {
            updates.push({
              id: node.id,
              color: originalNode.color,
              borderWidth: originalNode.borderWidth
            });
          }
        });
      }

      if (updates.length > 0) {
        this.visData.nodes.update(updates);
      }
    });
  }

  ngOnInit(): void {
    this.startAnimationLoop();
  }

  private startAnimationLoop(): void {
    const animate = (timestamp: number) => {
      if (!this.animationStartTime) {
        this.animationStartTime = timestamp;
      }

      const network = this.networkInstance();
      const loadingIds = this.loadingNodeIds();

      if (network && loadingIds.size > 0) {
        network.redraw();
      } else {
        this.animationStartTime = null;
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  private updateNetworkData(networkData: NetworkData) {
    const newNodes = networkData.nodes;
    const newEdges = networkData.edges;

    const currentNodeIds = this.visData.nodes.getIds();
    const newNodeIds = newNodes.map(n => n.id);

    const nodesToAdd = newNodes.filter(n => !currentNodeIds.includes(n.id));
    const nodesToRemove = currentNodeIds.filter(id => !newNodeIds.includes(id));

    if (nodesToRemove.length > 0) {
      this.visData.nodes.remove(nodesToRemove);
    }
    if (nodesToAdd.length > 0) {
      this.visData.nodes.add(nodesToAdd);
    }
    const currentEdgeIds = this.visData.edges.getIds();
    this.visData.edges.remove(currentEdgeIds);
    this.visData.edges.add(newEdges);
  }

  private createNetwork(containerEl: HTMLElement, data: { nodes: DataSet<any>, edges: DataSet<any>}) {
    this.destroyNetwork();

    const fallbackIcon = 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%23475569"/></svg>';

    const options: Options = {
      autoResize: true,
      height: '100%',
      width: '100%',
      nodes: {
        brokenImage: fallbackIcon,
        borderWidth: 2,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.5)',
          size: 10,
          x: 5,
          y: 5
        },
        shapeProperties: {
          useBorderWithImage: true,
        },
        color: {
          highlight: { border: '#c4b5fd', background: '#6d28d9' },
          hover: { border: '#a5b4fc', background: '#5b21b6' }
        }
      },
      edges: {
        width: 1.5,
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.5
        },
        color: {
            color: 'rgba(75, 85, 99, 0.8)',
            highlight: '#a78bfa',
            hover: '#d1d5db',
        },
        arrows: {
          to: { enabled: false }
        }
      },
      physics: {
        enabled: this.physicsEnabled(),
        forceAtlas2Based: {
          gravitationalConstant: -80,
          centralGravity: 0.005,
          springLength: 150,
          springConstant: 0.08,
          avoidOverlap: 0.7,
          damping: 0.6,
        },
        maxVelocity: 100,
        minVelocity: 0.75,
        solver: 'forceAtlas2Based',
        stabilization: {
          enabled: true,
          iterations: 1000,
          fit: true
        }
      },
      interaction: {
        tooltipDelay: 100,
        hideEdgesOnDrag: false,
        hover: true,
        navigationButtons: false,
        keyboard: true,
        zoomView: true,
        dragView: true
      },
      layout: {
        improvedLayout: true,
      },
      manipulation: {
        enabled: false,
        addEdge: (edgeData: any, callback: (data: any) => void) => {
          if (edgeData.from !== edgeData.to) {
            const fromIsUser = edgeData.from.toString().startsWith('user-');
            const toIsUser = edgeData.to.toString().startsWith('user-');
            if (fromIsUser && toIsUser) {
              callback(null);
              return;
            }
            this.edgeAdded.emit(edgeData);
            callback(edgeData);
          }
        },
        deleteEdge: (edgeData: any, callback: (data: any) => void) => {
          this.edgeDeleted.emit(edgeData);
          callback(edgeData);
        },
      }
    };

    const network = new Network(containerEl, data, options);

    network.on('afterDrawing', (ctx) => {
      const loadingIds = this.loadingNodeIds();
      if (loadingIds.size > 0) {
        const timestamp = performance.now();
        if (!this.animationStartTime) {
          this.animationStartTime = timestamp;
        }
        const elapsedTime = timestamp - this.animationStartTime;

        const positions = network.getPositions([...loadingIds]);

        for (const nodeId of loadingIds) {
            const pos = positions[nodeId];
            if (pos) {
                const boundingBox = network.getBoundingBox(nodeId);
                const radius = (boundingBox.right - boundingBox.left) / 2 + 5;
                const lineWidth = 4;

                const gradient = ctx.createConicGradient(0, pos.x, pos.y);
                gradient.addColorStop(0, 'rgba(34, 211, 238, 0)');
                gradient.addColorStop(0.15, 'rgba(34, 211, 238, 1)');
                gradient.addColorStop(0.6, 'rgba(129, 140, 248, 1)');
                gradient.addColorStop(1, 'rgba(129, 140, 248, 0)');

                ctx.strokeStyle = gradient;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';

                const baseArcLength = Math.PI * 1.3;
                const pulse = Math.sin(elapsedTime / 450) * 0.5;
                const arcLength = baseArcLength + pulse;

                const rotationSpeed = 0.0025;
                const rotation = (elapsedTime * rotationSpeed);

                ctx.save();

                ctx.translate(pos.x, pos.y);
                ctx.rotate(rotation);
                ctx.translate(-pos.x, -pos.y);

                ctx.beginPath();
                ctx.arc(pos.x, pos.y, radius, 0, arcLength);
                ctx.stroke();

                ctx.restore();
            }
        }
      } else {
        this.animationStartTime = null;
      }

      const nodesToDraw = this.nodesWithFollows();
      if (nodesToDraw.size === 0) {
        if (this.iconOverlayNodes().length > 0) {
            this.iconOverlayNodes.set([]);
        }
        return;
      }

      const overlays: {nodeId: string, x: number, y: number}[] = [];

      for (const nodeId of nodesToDraw) {
        const nodePosition = network.getPosition(nodeId as string);
        if (nodePosition) {
            const boundingBox = network.getBoundingBox(nodeId as string);
            const radius = (boundingBox.right - boundingBox.left) / 2;

            const iconCanvasPos = {
                x: nodePosition.x + radius * 0.707,
                y: nodePosition.y - radius * 0.707,
            };
            const domPosition = network.canvasToDOM(iconCanvasPos);
            overlays.push({ nodeId: nodeId as string, x: domPosition.x, y: domPosition.y });
        }
      }
      this.iconOverlayNodes.set(overlays);
    });

    network.on('click', (properties) => {
      if (this.editMode()) {
        return;
      }

      const { nodes } = properties;
      if (nodes.length > 0) {
        const clickedNodeId = nodes[0] as string;
        if (clickedNodeId.startsWith('user-')) {
          this.nodeClicked.emit(clickedNodeId);
        } else if (!clickedNodeId.startsWith('group-')) {
          this.platformNodeClicked.emit(clickedNodeId);
        }
      }
    });

    network.on('doubleClick', (properties) => {
      if (this.editMode()) {
        return;
      }
      const { nodes, pointer } = properties;
      if (nodes.length > 0) {
        const clickedNodeId = nodes[0] as string;
        if (clickedNodeId.startsWith('group-')) {
          this.groupClicked.emit({ nodeId: clickedNodeId, position: pointer.canvas });
        }
      }
    });

    network.on('hoverEdge', (properties) => {
      if (this.editMode()) {
        this.isManipulating.set(true);
        this.cancelHideDeleteButton();

        const edgeId = properties.edge as string;

        const edgeData = (network as any).body.data.edges.get(edgeId);

        if (edgeData?.from && edgeData?.to) {
          const connectedNodeIds = [edgeData.from, edgeData.to];
          const positions = network.getPositions(connectedNodeIds as string[]);
          const fromNode = positions[edgeData.from];
          const toNode = positions[edgeData.to];

          if (fromNode && toNode) {
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;

            const domPos = network.canvasToDOM({ x: midX, y: midY });

            this.deleteButtonState.set({
              visible: true,
              x: domPos.x,
              y: domPos.y,
              edgeId: edgeId
            });
          }
        }
      }
    });

    network.on('blurEdge', () => {
      if (this.editMode()) {
        this.isManipulating.set(false);
        this.hideDeleteButton();
      }
    });

    network.on('oncontext', (properties) => {
      properties.event.preventDefault();
      const nodeId = network.getNodeAt(properties.pointer.DOM);
      if (nodeId) {
          this.state.onNodeRightClicked({ nodeId: nodeId as string, event: properties.event }, this.editMode());
      }
    });

    network.on('dragStart', () => {
      this.dragStart.emit();
      this.hideDeleteButton(true);
    });

    network.on('zoom', (properties: any) => {
      const currentScale = network.getScale();
      const currentPosition = network.getViewPosition();

      if (currentScale <= this.minZoomScale) {
        const lockPosition = this.minZoomLockPosition ?? currentPosition;
        this.minZoomLockPosition = lockPosition;

        if (properties?.direction === '-') {
          network.moveTo({ scale: this.minZoomScale, position: lockPosition, animation: false });
        } else {
          network.moveTo({ scale: this.minZoomScale, animation: false });
        }
      } else {
        this.minZoomLockPosition = currentPosition;
      }

      this.zoom.emit();
      this.hideDeleteButton(true);
    });

    this.networkInstance.set(network);
  }

  ngOnDestroy(): void {
    this.destroyNetwork();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private destroyNetwork(): void {
    if (this.networkInstance()) {
      this.networkInstance()?.destroy();
      this.networkInstance.set(null);
    }
    this.visData.nodes.clear();
    this.visData.edges.clear();
  }

  deleteEdge(edgeId: string) {
    this.edgeDeleted.emit({ edges: [edgeId] });
    this.hideDeleteButton(true);
  }

  cancelHideDeleteButton() {
    clearTimeout(this.hideButtonTimeout);
  }

  hideDeleteButton(immediate = false) {
    if (immediate) {
      this.deleteButtonState.set({ visible: false, x: 0, y: 0, edgeId: null });
    } else {
      this.hideButtonTimeout = setTimeout(() => {
        this.deleteButtonState.set({ visible: false, x: 0, y: 0, edgeId: null });
      }, 200);
    }
  }
}
