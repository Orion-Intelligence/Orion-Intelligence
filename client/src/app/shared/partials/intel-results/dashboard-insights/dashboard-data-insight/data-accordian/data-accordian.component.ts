import {Component, Input} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-data-accordian',
  imports: [
    CommonModule,
    NgOptimizedImage
  ],
  templateUrl: './data-accordian.component.html'
})
export class DataAccordianComponent {
  @Input() analytics: any;
  @Input() categories: { key: string; label: string; icon?: string }[] = [];
}
