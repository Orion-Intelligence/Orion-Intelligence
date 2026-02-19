import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
@Component({
    selector: 'app-expand-toggle-button',
    standalone: true,
    templateUrl: './expand-toggle-button.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpandToggleButtonComponent {
    isExpanded = input(false);
    toggled = output<void>();
}
