import { Component, Input } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { JsonViewerComponent } from './json-viewer/json-viewer.component';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';
@Component({
  selector: 'app-json-api-viewer',
  standalone: true,
  imports: [CommonModule, NgClass, JsonViewerComponent, JsonViewerComponent, TooltipDirective],
  templateUrl: './json-api-viewer.component.html',
})
export class JsonApiViewerComponent {
  isExpanded = false;

  @Input() jsonData: any;

  toggleContent(): void {
    this.isExpanded = !this.isExpanded;
  }
}
