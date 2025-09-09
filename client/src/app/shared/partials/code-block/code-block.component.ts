import {Component, Input} from '@angular/core';
import {NgClass, NgIf} from '@angular/common';
import {TooltipDirective} from '../../directive/tooltip-directive.directive';

@Component({
  selector: 'app-code-block',
  standalone: true,
  templateUrl: './code-block.component.html',
  imports: [
    NgClass,
    NgIf,
    TooltipDirective
  ]
})
export class CodeBlockComponent {
  @Input() code: string | undefined = '';
  isExpanded = false;

  toggle(): void {
    this.isExpanded = !this.isExpanded;
  }
}
