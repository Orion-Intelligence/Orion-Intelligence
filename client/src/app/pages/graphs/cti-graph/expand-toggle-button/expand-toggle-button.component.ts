import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-expand-toggle-button',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './expand-toggle-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpandToggleButtonComponent {
  isExpanded = input(false);
  toggled = output<undefined>();
}
