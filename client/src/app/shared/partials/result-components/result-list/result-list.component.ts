import { Component, effect, input } from '@angular/core';

import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-result-list',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './result-list.component.html',
  animations: [fadeInDashboardItem]
})
export class ResultListComponent {
  readonly listItemsInput = input<string[]>([], { alias: 'listItems' });
  filteredItems: string[] = [];
  copiedIndex: number | null = null;
  readonly activeTab = input('');

  constructor() {
    effect(() => {
      this.filteredItems = this.listItemsInput().filter(item => item.length >= 2);
    });
  }

  copyText(text: string, index: number): void {
    void navigator.clipboard.writeText(text).then(() => {
      this.copiedIndex = index;
      setTimeout(() => {
        this.copiedIndex = null;
      }, 1500);
    });
  }
}
