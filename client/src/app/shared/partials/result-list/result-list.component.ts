import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, transition, animate } from '@angular/animations';
import {fadeInDashboardItem} from '../../animations/dashboard.item.animation';
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
  @Input() activeTab: string = ''; // Ensure activeTab is passed from the parent component

  getRows(items: string[], itemsPerRow: number): string[][] {
    const rows = [];
    for (let i = 0; i < items.length; i += itemsPerRow) {
      rows.push(items.slice(i, i + itemsPerRow));
    }
    return rows;
  }
}
