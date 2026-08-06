import { Component, input, output } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CtiGraphFilters, CtiGraphLegendItem, CtiGraphStats } from '../../../../shared/model/graph/cti-graph.model';
@Component({
  selector: 'app-cti-sidebar',
  standalone: true,
  imports: [SidebarComponent],
  template: `<graph-sidebar class="block h-full min-h-0"
    [filters]="filters()"
    [stats]="stats()"
    [legendItems]="legendItems()"
    [clusterLegendItems]="clusterLegendItems()"
    [collapsed]="collapsed()"
    (filtersApply)="filtersApply.emit($event)"
    (collapsedChange)="collapsedChange.emit($event)">
  </graph-sidebar>`
})
export class CtiSidebarComponent {
  readonly filters = input<CtiGraphFilters | null>(null);
  readonly stats = input<CtiGraphStats | null>(null);
  readonly legendItems = input<CtiGraphLegendItem[]>([]);
  readonly clusterLegendItems = input<CtiGraphLegendItem[]>([]);
  readonly collapsed = input(false);
  readonly collapsedChange = output<boolean>();
  readonly filtersApply = output<CtiGraphFilters>();
}
