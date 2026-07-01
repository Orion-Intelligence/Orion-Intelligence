import { Component, HostListener, OnChanges, OnInit, SimpleChanges, input, output } from '@angular/core';
import { SidebarShellComponent } from '../../shared/sidebar-shell/sidebar-shell.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CtiGraphFilters, CtiGraphLegendItem, CtiGraphStats } from '../../../../shared/model/graph/cti-graph.model';

@Component({
  selector: 'graph-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  imports: [SidebarShellComponent, TranslatePipe],
})
export class SidebarComponent implements OnInit, OnChanges {
  isCollapsed = false;
  isMobile = false;
  readonly filters = input<CtiGraphFilters | null>(null);
  readonly stats = input<CtiGraphStats | null>(null);
  readonly legendItems = input<CtiGraphLegendItem[]>([]);
  readonly clusterLegendItems = input<CtiGraphLegendItem[]>([]);
  readonly collapsed = input(false);
  readonly collapsedChange = output<boolean>();

  ngOnInit(): void {
    this.updateViewportState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['collapsed']) {
      this.isCollapsed = !!changes['collapsed'].currentValue;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateViewportState();
  }

  toggleCollapsed() {
    this.isCollapsed = !this.isCollapsed;
    this.collapsedChange.emit(this.isCollapsed);
  }

  onMobileBackdropClick(): void {
    if (!this.isMobile) {
      return;
    }
    this.isCollapsed = true;
    this.collapsedChange.emit(this.isCollapsed);
  }

  get queryModeLabel(): string {
    const type = this.filters()?.selectedType || 'cluster';
    if (type === 'property') {
      return 'Entity';
    }
    return this.formatLabel(type);
  }

  get queryValueLabel(): string {
    const filters = this.filters();
    if (!filters) {
      return 'All';
    }
    if (filters.selectedType === 'property') {
      const value = filters.propertyValue || 'All';
      const type = filters.propertyType && filters.propertyType !== 'all'
        ? this.formatLabel(filters.propertyType)
        : 'Any entity';
      return `${type}: ${value}`;
    }
    return this.formatLabel(filters.singleInput || 'all');
  }

  get nodeLimitLabel(): string {
    return String(this.filters()?.maxEdge ?? 25);
  }

  get depthLabel(): string {
    return String(this.filters()?.maxDepth ?? 1);
  }

  private updateViewportState(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const nextIsMobile = window.innerWidth < 768;
    if (nextIsMobile !== this.isMobile) {
      this.isMobile = nextIsMobile;
      if (this.isMobile) {
        this.isCollapsed = true;
        this.collapsedChange.emit(this.isCollapsed);
      }
    }
  }

  private formatLabel(value: string): string {
    const clean = String(value || 'all').replace(/^m_/, '').replace(/_/g, ' ');
    if (clean.toLowerCase() === 'apt') {
      return 'APT';
    }
    return clean.replace(/\b\w/g, character => character.toUpperCase());
  }
}
