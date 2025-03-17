import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataAccordianComponent } from './data-accordian/data-accordian.component';

@Component({
  selector: 'app-data-insight',
  imports: [
    CommonModule,
    DataAccordianComponent,
  ],
  templateUrl: './data-insight.component.html'
})
export class DataInsightComponent {
  @Input() analytics: any;

  get categories() {
    return this.analytics.consolidated_lists
  }

  private formatLabel(key: string): string {
    return key
      .replace('m_', '')
      .split(/(?=[A-Z])|_|-/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
