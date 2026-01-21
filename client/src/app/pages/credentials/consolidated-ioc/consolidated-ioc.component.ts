import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RankedCallbackModel } from '../../../shared/model/results/consolidated/ranked.callback.model';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';

@Component({
  selector: 'app-consolidated-ioc',
  imports: [NgFor, NgIf, TooltipDirective],
  templateUrl: './consolidated-ioc.component.html',
  animations: [fadeInDashboardItem],
})
export class ConsolidatedIocComponent implements OnInit {
  expandedRows = new Set<number>();
  @Input() rankedResult: RankedCallbackModel = new RankedCallbackModel();
  @Input() apiElapsedTime: any;
  @Input() resultsFound: number = 0;
  @Input() showStats: boolean = true;
  @Input() isLoading!: boolean;

  @Output() onToggleSwitch = new EventEmitter<null>();

  ngOnInit(): void { }

  toggleRow(index: number) {
    if (this.expandedRows.has(index)) {
      this.expandedRows.clear();
      return;
    }
    this.expandedRows.clear();
    this.expandedRows.add(index);
  }

  isExpanded(index: number): boolean {
    return this.expandedRows.has(index);
  }

  sliceText(text: string, maxLength: number = 30): string {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  }
  getTagEntries(result: any): { key: string; values: any[] }[] {
    if (!result) return [];

    return Object.keys(result)
      .filter(
        key =>
          key.startsWith('m_') &&
          Array.isArray(result[key]) &&
          result[key].length > 0
      )
      .map(key => ({
        key,
        values: result[key]
      }));
  }
  formatKeyLabel(key: string): string {
    const cleaned = key.replace(/^m_/, '').replace(/[^a-zA-Z0-9]/g, ' ');
    return cleaned.length < 4
      ? cleaned.toUpperCase()
      : cleaned
        .toLowerCase()
        .replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1));
  }

}
