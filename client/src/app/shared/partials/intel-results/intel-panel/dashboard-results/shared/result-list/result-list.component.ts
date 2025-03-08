import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-result-list',
  imports: [CommonModule],
  templateUrl: './result-list.component.html'
})
export class ResultListComponent {
  @Input() listItems: string[] = [];

  getRows(items: string[], itemsPerRow: number): string[][] {
    const rows = [];
    for (let i = 0; i < items.length; i += itemsPerRow) {
      rows.push(items.slice(i, i + itemsPerRow));
    }
    return rows;
  }

}
