import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeDefacementResultItem } from '../../../../../model/homepage/home_defacement_results';

@Component({
  selector: 'app-defacement-results',
  imports: [CommonModule],
  templateUrl: './defacement-results.component.html',
  styleUrl: './defacement-results.component.css'
})
export class DefacementResultsComponent implements OnInit {
  results!: HomeDefacementResultItem[];
  isResultsBarExpanded = false;

  ngOnInit(): void {
    this.results = [
      {
        companyName: 'Acme Corp',
        source: 'HackerNews',
        url: 'http://example.com/acme-leak',
        date: '2025-08-06'
      },
      {
        companyName: 'Globex Inc',
        source: 'DarkWeb Forum',
        url: 'http://example.com/globex-leak',
        date: '2025-08-05'
      },
      {
        companyName: 'Soylent Corp',
        source: 'Defaced.io',
        url: 'http://example.com/soylent-leak',
        date: '2025-08-04'
      },
      {
        companyName: 'Globex Inc',
        source: 'DarkWeb Forum',
        url: 'http://example.com/globex-leak',
        date: '2025-08-05'
      },
    ];
  }

  toggleResultsBarCollapse(): void {
    this.isResultsBarExpanded = !this.isResultsBarExpanded;
  }
}
