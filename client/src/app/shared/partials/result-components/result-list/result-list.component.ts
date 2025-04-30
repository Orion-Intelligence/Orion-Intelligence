import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { fadeInDashboardItem } from '../../../animations/dashboard.item.animation';
@Component({
  selector: 'app-result-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result-list.component.html',
  animations: [
    fadeInDashboardItem
  ]
})
export class ResultListComponent {
  @Input() listItems: string[] = [];
  @Input() activeTab: string = '';

  getRows(items: string[], itemsPerRow: number): string[][] {
    const rows = [];
    for (let i = 0; i < items.length; i += itemsPerRow) {
      rows.push(items.slice(i, i + itemsPerRow));
    }
    return rows;
  }






  copiedIndex: number | null = null;

  copyText(text: string, index: number) {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedIndex = index;
      setTimeout(() => this.copiedIndex = null, 2000);
    });
  }

  hideCopied(index: number) {
    if (this.copiedIndex === index) {
      this.copiedIndex = null;
    }
  }

}