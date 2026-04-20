import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';
@Component({
  selector: 'app-code-block',
  standalone: true,
  templateUrl: './code-block.component.html',
  imports: [
    NgClass,
    TooltipDirective
  ]
})
export class CodeBlockComponent {
  isExpanded = false;
  readonly code = input<string | undefined>('');

  toggle(): void {
    this.isExpanded = !this.isExpanded;
  }
}
