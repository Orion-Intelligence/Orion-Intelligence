import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-json-viewer',
  imports: [CommonModule],
  templateUrl: './json-viewer.component.html'
})
export class JsonViewerComponent {
  @Input() json: any;
  @Input() level: number = 0;

  isObject(value: any): boolean {
    return value && typeof value === 'object';
  }

  toggle(item: any): void {
    item.__expanded = !item.__expanded;
  }

  keys(obj: any): string[] {
    return Object.keys(obj);
  }

}
