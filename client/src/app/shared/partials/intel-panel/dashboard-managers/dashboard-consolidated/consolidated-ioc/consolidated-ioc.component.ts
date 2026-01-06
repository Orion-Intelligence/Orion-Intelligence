import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RankedCallbackModel } from '../../../../../model/results/consolidated/ranked.callback.model';

@Component({
  selector: 'app-consolidated-ioc',
  imports: [NgFor, NgIf],
  templateUrl: './consolidated-ioc.component.html'
})
export class ConsolidatedIocComponent implements OnInit {
  expandedRows = new Set<number>();
  @Input() rankedResult: RankedCallbackModel = new RankedCallbackModel();
  @Input() apiElapsedTime: any;
  @Input() resultsFound: number = 0;


  @Output() onToggleSwitch = new EventEmitter<null>();

  rows = [
    {
      email: 'bbc.com',
      category: 'news',
      expanded: false,
      details: {
        description: 'Leaked intelligence documents and media coverage.',
        sources: [
          'bbc.com',
          'nytimes.com',
          'reuters.com'
        ]
      }
    },
    {
      email: 'ddosecrets.com',
      category: 'leak',
      expanded: false,
      details: {
        description: 'Confidential data exposed by threat actors.',
        sources: [
          'ddosecrets.com',
          'archive.org'
        ]
      }
    }
  ];

  ngOnInit(): void {
    console.log(this.rankedResult.pageCount);
  }
  toggleRow(index: number) {
    if (this.expandedRows.has(index)) {
      this.expandedRows.delete(index);
    } else {
      this.expandedRows.add(index);
    }
  }

  isExpanded(index: number): boolean {
    return this.expandedRows.has(index);
  }

  sliceText(text: string, maxLength: number = 30): string {
    if (!text) return '';
    return text.length > maxLength
      ? text.slice(0, maxLength) + '...'
      : text;
  }
}
