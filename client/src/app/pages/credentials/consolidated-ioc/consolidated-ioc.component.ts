import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RankedCallbackModel } from '../../../shared/model/results/consolidated/ranked.callback.model';
import {fadeInDashboardItem} from '../../../shared/animations/dashboard.item.animation';

@Component({
  selector: 'app-consolidated-ioc',
  imports: [NgFor, NgIf],
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

  ngOnInit(): void {}

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
}
