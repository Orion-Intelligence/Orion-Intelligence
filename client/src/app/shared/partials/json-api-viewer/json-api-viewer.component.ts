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
  copied = false;
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  @Input() jsonData: any;

  toggleContent(): void {
    this.isExpanded = !this.isExpanded;
  }

  copyJson(event: MouseEvent): void {
    event.stopPropagation();
    if (this.jsonData == null) {
      return;
    }
    const payload = JSON.stringify(this.jsonData, null, 2);
    navigator.clipboard?.writeText(payload).then(() => {
      this.copied = true;
      if (this.copyTimer) {
        clearTimeout(this.copyTimer);
      }
      this.copyTimer = setTimeout(() => {
        this.copied = false;
      }, 1400);
    });
  }
}
