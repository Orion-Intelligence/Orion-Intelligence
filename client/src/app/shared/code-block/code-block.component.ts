import { Component, Input } from '@angular/core';
import {NgClass, NgIf} from '@angular/common';

@Component({
  selector: 'app-code-block',
  standalone: true,
  templateUrl: './code-block.component.html',
  imports: [
    NgClass,
    NgIf
  ]
})
export class CodeBlockComponent {
  @Input() code: string | undefined = '';
  isExpanded = false;

  toggle(): void {
    this.isExpanded = !this.isExpanded;
  }
}
