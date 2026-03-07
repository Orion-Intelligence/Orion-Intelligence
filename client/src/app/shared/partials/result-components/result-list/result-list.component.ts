import { Component, Input } from '@angular/core';

import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
@Component({
  selector: 'app-result-list',
  standalone: true,
  imports: [],
  templateUrl: './result-list.component.html',
  animations: [fadeInDashboardItem]
})
export class ResultListComponent {
  filteredItems: string[] = [];
  copiedIndex: number | null = null;

  @Input() activeTab = '';

  @Input()
  set listItems(items: string[]) {
    this.filteredItems = items.filter(item => item.length >= 2);
  }

  copyText(text: string, index: number): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedIndex = index;
      setTimeout(() => {
        this.copiedIndex = null;
      }, 1500);
    });
  }
}
