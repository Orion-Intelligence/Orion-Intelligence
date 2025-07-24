import {Component, Input} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-data-accordian',
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './data-accordian.component.html'
})
export class DataAccordianComponent {
  @Input() analytics: any;
  @Input() categories: Record<string, string[]> = {};

  objectKeys(obj: Record<string, any>): string[] {
    return Object.keys(obj);
  }
}
