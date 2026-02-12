import { Component, ChangeDetectionStrategy, input, viewChild, ElementRef, effect, signal, OnDestroy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Network, Options } from 'vis-network';
import { NetworkData } from '../../../shared/model/social/social-scan.models';

@Component({
  selector: 'app-network-graph',
  templateUrl: './network-graph.component.html',
  styleUrls: ['./network-graph.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  host: {
    '[class.manipulation-active]': 'isManipulating()',
  }
})
export class NetworkGraphComponent implements OnDestroy {
  data = input.required<NetworkData>();
  focusNodeId = input<string | null>(null);
  editMode = input(false);
  physicsEnabled = input(false);
  container = viewChild.required<ElementRef>('networkContainer');
  nodeClicked = output<string>();
  platformNodeClicked = output<string>();
  nodeRightClicked = output<{ nodeId: string; event: MouseEvent }>();
  dragStart = output<void>();
  zoom = output<void>();
  edgeAdded = output<{ from: string, to: string }>();
  edgeDeleted = output<{ edges: string[] }>();
  
  private networkInstance = signal<Network | null>(null);
  deleteButtonState = signal({
    visible: false,
    x: 0,
    y: 0,
    edgeId: null as string | null
  });
  private hideButtonTimeout: any;
  isManipulating = signal(false);

  constructor() {
    effect(() => {
      const networkData = this.data();
      const containerEl = this.container()?.nativeElement;

      if (containerEl) {
        if (networkData && (networkData.nodes.length > 0 || networkData.edges.length > 0)) {
          if (this.networkInstance()) {
            this.networkInstance()?.setData(networkData);
          } else {
            this.createNetwork(containerEl, networkData);
          }
        } else {
          this.destroyNetwork();
        }
      }
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
      if (!network) return;
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
  }

  private createNetwork(containerEl: HTMLElement, networkData: NetworkData) {
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
        addEdge: (data: any, callback: (data: any) => void) => {
          if (data.from !== data.to) {
            this.edgeAdded.emit(data);
            callback(data);
          }
        },
        deleteEdge: (data: any, callback: (data: any) => void) => {
          this.edgeDeleted.emit(data);
          callback(data);
        },
      }
    };

    const network = new Network(containerEl, networkData, options);
    
    network.on('click', (properties) => {
      if (this.editMode()) {
        return;
      }

      const { nodes } = properties;
      if (nodes.length > 0) {
        const clickedNodeId = nodes[0] as string;
        if (clickedNodeId.startsWith('user-')) {
          this.nodeClicked.emit(clickedNodeId);
        } else {
          this.platformNodeClicked.emit(clickedNodeId);
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

    network.on('blurEdge', (properties) => {
      if (this.editMode()) {
        this.isManipulating.set(false);
        this.hideDeleteButton();
      }
    });

    network.on('oncontext', (properties) => {
      properties.event.preventDefault();
      const nodeId = network.getNodeAt(properties.pointer.DOM);
      if (nodeId) {
          this.nodeRightClicked.emit({ nodeId: nodeId as string, event: properties.event });
      }
    });

    network.on('dragStart', () => {
      this.dragStart.emit();
      this.hideDeleteButton(true);
    });

    network.on('zoom', () => {
      this.zoom.emit();
      this.hideDeleteButton(true);
    });
    
    this.networkInstance.set(network);
  }

  ngOnDestroy(): void {
    this.destroyNetwork();
  }

  private destroyNetwork(): void {
    if (this.networkInstance()) {
      this.networkInstance()?.destroy();
      this.networkInstance.set(null);
    }
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