import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
@Component({
  selector: 'app-cti-sidebar',
  standalone: true,
  imports: [SidebarComponent],
  template: `<graph-sidebar [filters]="filters" [collapsed]="collapsed" (filtersApplied)="filtersApplied.emit($event)" (filtersChanged)="filtersChanged.emit($event)" (collapsedChange)="collapsedChange.emit($event)"></graph-sidebar>`
})
export class CtiSidebarComponent {
  @Input() filters: { selectedType: string; singleInput: string; propertyType: string; propertyValue: string; maxEdge: number; maxDepth: number; } | null = null;
  @Input() collapsed = false;
  @Output() filtersApplied = new EventEmitter<{ selectedType: string; singleInput: string; propertyType: string; propertyValue: string; maxEdge: number; maxDepth: number; }>();
  @Output() filtersChanged = new EventEmitter<{ selectedType: string; singleInput: string; propertyType: string; propertyValue: string; maxEdge: number; maxDepth: number; }>();
  @Output() collapsedChange = new EventEmitter<boolean>();
}
