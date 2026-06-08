import { Component, HostListener, OnChanges, OnInit, SimpleChanges, input, output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { GraphClusterType, GraphType, search_filter_labels } from '../../../../shared/constants/shared-enums';
import { SidebarShellComponent } from '../../shared/sidebar-shell/sidebar-shell.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'graph-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  imports: [FormsModule, ReactiveFormsModule, TitleCasePipe, SidebarShellComponent, TranslatePipe],
})
export class SidebarComponent implements OnInit, OnChanges {
  isCollapsed = false;
  isMobile = false;
  selectedType = 'cluster';
  singleInput = 'all';
  propertyType = 'all';
  propertyValue = '';
  maxNodes = 25;
  maxDepth = 1;
  graphTypeOptions = Object.values(GraphType);
  graphClusterOptions = Object.values(GraphClusterType);
  graphAllowedProperties = Object.entries(search_filter_labels).map(([key, label]) => ({
    label,
    key
  }));
  readonly filters = input<{
      selectedType: string;
      singleInput: string;
      propertyType: string;
      propertyValue: string;
      maxEdge: number;
      maxDepth: number;
  } | null>(null);
  readonly collapsed = input(false);
  readonly filtersApplied = output<{
      selectedType: string;
      singleInput: string;
      propertyType: string;
      propertyValue: string;
      maxEdge: number;
      maxDepth: number;
  }>();
  readonly filtersChanged = output<{
      selectedType: string;
      singleInput: string;
      propertyType: string;
      propertyValue: string;
      maxEdge: number;
      maxDepth: number;
  }>();
  readonly collapsedChange = output<boolean>();

  private buildFilterPayload() {
    return {
      selectedType: this.selectedType,
      singleInput: this.singleInput,
      propertyType: this.propertyType,
      propertyValue: this.propertyValue,
      maxEdge: this.maxNodes,
      maxDepth: this.maxDepth
    };
  }

  private emitFilters() {
    this.filtersApplied.emit(this.buildFilterPayload());
  }

  emitDraftFilters() {
    this.filtersChanged.emit(this.buildFilterPayload());
  }

  private applyIncomingFilters(filters: { selectedType: string; singleInput: string; propertyType: string; propertyValue: string; maxEdge: number; maxDepth: number; }) {
    this.selectedType = filters.selectedType || 'cluster';
    this.singleInput = filters.singleInput || 'all';
    this.propertyType = filters.propertyType || 'all';
    this.propertyValue = filters.propertyValue || '';
    this.maxNodes = Number(filters.maxEdge) || 25;
    this.maxDepth = Number(filters.maxDepth) || 1;
  }

  ngOnInit(): void {
    this.updateViewportState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']?.currentValue) {
      this.applyIncomingFilters(changes['filters'].currentValue);
    }
    if (changes['collapsed']) {
      this.isCollapsed = !!changes['collapsed'].currentValue;
    }
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

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateViewportState();
  }

  applyFilters() {
    this.emitFilters();
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

  resetFilters() {
    this.selectedType = 'cluster';
    this.singleInput = 'all';
    this.propertyType = 'all';
    this.propertyValue = '';
    this.maxNodes = 25;
    this.maxDepth = 1;
    this.emitDraftFilters();
    this.emitFilters();
  }

  onFormatPropertyType(type: string) {
    return type.toLowerCase().replace("m_", "").replace("_", " ");
  }

  onTypeChange(type: string) {
    this.selectedType = type;
    if (type === 'cluster') {
      this.singleInput = 'all';
    }
    else if (type === 'document') {
      this.singleInput = '';
    }
    else if (type === 'property') {
      this.propertyType = 'all';
      this.propertyValue = '';
    }
    this.emitDraftFilters();
  }

  validateMaxNodes() {
    if (!this.maxNodes || this.maxNodes < 20 || this.maxNodes > 800) {
      this.maxNodes = 25;
    }
    this.emitDraftFilters();
  }

  validateMaxDepth() {
    if (!this.maxDepth || this.maxDepth < 1 || this.maxDepth > 5) {
      this.maxDepth = 2;
    }
    this.emitDraftFilters();
  }
}
