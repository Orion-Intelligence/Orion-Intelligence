import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {fadeInDashboardItem} from '../../../animations/dashboard.item.animation';

@Component({
  selector: 'app-result-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result-list.component.html',
  animations: [fadeInDashboardItem]
})
export class ResultListComponent {
  @Input() listItems: string[] = [];
  @Input() activeTab = '';

  copiedIndex: number | null = null;

  copyText(text: string, index: number): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedIndex = index;
      setTimeout(() => {
        this.copiedIndex = null;
      }, 1500);
    });
  }
}
