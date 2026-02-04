
import { Component, ChangeDetectionStrategy, input, viewChild, ElementRef, effect, signal, OnDestroy, output } from '@angular/core';
import { Network, Options } from 'vis-network';
import { NetworkData } from '../../../shared/model/social/social-scan.models';

@Component({
  selector: 'app-network-graph',
  templateUrl: './network-graph.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkGraphComponent implements OnDestroy {
  data = input.required<NetworkData>();
  focusNodeId = input<string | null>(null);
  container = viewChild.required<ElementRef>('networkContainer');
  nodeClicked = output<string>();
  platformNodeClicked = output<string>();
  nodeRightClicked = output<{ nodeId: string; event: MouseEvent }>();
  dragStart = output<void>();
  zoom = output<void>();
  
  private networkInstance = signal<Network | null>(null);

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
    }, { allowSignalWrites: true });

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
  }

  private createNetwork(containerEl: HTMLElement, networkData: NetworkData) {
    this.destroyNetwork(); 
    
    const options: Options = {
      autoResize: true,
      height: '100%',
      width: '100%',
      nodes: {
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
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 250,
          springConstant: 0.09,
          avoidOverlap: 0.9,
        },
        maxVelocity: 50,
        solver: 'forceAtlas2Based',
        timestep: 0.5,
        stabilization: { 
          enabled: true,
          iterations: 200,
          fit: true
        }
      },
      interaction: {
        tooltipDelay: 100,
        hideEdgesOnDrag: true,
        hover: true,
        navigationButtons: false,
        keyboard: true,
        zoomView: true,
        dragView: true,
        minZoom: 0.6,
        maxZoom: 2.5,
      },
      layout: {
        improvedLayout: true,
      }
    };

    const network = new Network(containerEl, networkData, options);
    
    network.on('click', (properties) => {
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

    network.on('oncontext', (properties) => {
      properties.event.preventDefault();
      const nodeId = network.getNodeAt(properties.pointer.DOM);
      if (nodeId) {
          this.nodeRightClicked.emit({ nodeId: nodeId as string, event: properties.event });
      }
    });

    network.on('dragStart', () => {
      this.dragStart.emit();
    });

    network.on('zoom', () => {
      this.zoom.emit();
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
}
