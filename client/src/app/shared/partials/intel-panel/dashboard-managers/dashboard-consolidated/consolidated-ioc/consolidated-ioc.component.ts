import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RankedCallbackModel } from '../../../../../model/results/consolidated/ranked.callback.model';

@Component({
  selector: 'app-consolidated-ioc',
  imports: [NgFor, NgIf],
  templateUrl: './consolidated-ioc.component.html'
})
export class ConsolidatedIocComponent implements OnInit {
  @Input() rankedResult: RankedCallbackModel = new RankedCallbackModel();


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
  toggleRow(row: any) {
    row.expanded = !row.expanded;
  }
}
