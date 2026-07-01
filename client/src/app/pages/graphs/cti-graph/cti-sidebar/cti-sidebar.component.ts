import { Component, input, output } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CtiGraphFilters } from '../../../../shared/model/graph/cti-graph.model';
@Component({
  selector: 'app-cti-sidebar',
  standalone: true,
  imports: [SidebarComponent],
  template: `<graph-sidebar [filters]="filters()" [collapsed]="collapsed()" (filtersApplied)="filtersApplied.emit($event)" (filtersChanged)="filtersChanged.emit($event)" (collapsedChange)="collapsedChange.emit($event)"></graph-sidebar>`
})
export class CtiSidebarComponent {
  readonly filters = input<CtiGraphFilters | null>(null);
  readonly collapsed = input(false);
  readonly filtersApplied = output<CtiGraphFilters>();
  readonly filtersChanged = output<CtiGraphFilters>();
  readonly collapsedChange = output<boolean>();
}
