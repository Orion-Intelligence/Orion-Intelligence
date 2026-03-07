import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-graph-search-trigger',
  standalone: true,
  imports: [],
  templateUrl: './graph-search-trigger.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GraphSearchTriggerComponent {
  isExpanded = input(false);
  triggered = output<void>();
}
