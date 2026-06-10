import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-graph-search-trigger',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './graph-search-trigger.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GraphSearchTriggerComponent {
  isExpanded = input(false);
  triggered = output<undefined>();
}
