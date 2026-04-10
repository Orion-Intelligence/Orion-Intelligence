import { Component, input, output } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
@Component({
  selector: 'app-cti-sidebar',
  standalone: true,
  imports: [SidebarComponent],
  template: `<graph-sidebar [filters]="filters()" [collapsed]="collapsed()" (filtersApplied)="filtersApplied.emit($event)" (filtersChanged)="filtersChanged.emit($event)" (collapsedChange)="collapsedChange.emit($event)"></graph-sidebar>`
})
export class CtiSidebarComponent {
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
}
