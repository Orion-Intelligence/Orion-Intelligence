import {Component, Input} from '@angular/core';
import {NgForOf} from '@angular/common';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {DashboardService} from '../../../../../../services/dashboard/dashboard.service';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';

@Component({
  selector: 'app-dashboard-general-results-grid',
  templateUrl: './dashboard-general-results-grid.component.html', imports: [NgForOf, RouterLink]
})
export class DashboardGeneralResultsGridComponent {
  @Input() query!: string;
  currentUrl: string = '';
  queryParams: any = {};

  constructor(public dashboardService: DashboardService, private sanitizer: DomSanitizer, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];
    this.route.queryParams.subscribe(params => {
      this.queryParams = params;
    });
  }

  highlightWords(text: string, maxLength: number = 250): SafeHtml {
    if (!this.query || text.length <= maxLength) {
      return this.sanitizer.bypassSecurityTrustHtml(text.substring(0, maxLength));
    }

    let queryWords = this.query.split(/\s+/).map(word => word.toLowerCase());
    let bestSubstring = "";
    let maxKeywordCount = 0;

    for (let i = 0; i <= text.length - maxLength; i++) {
      let windowText = text.substring(i, i + maxLength);
      let wordCount = queryWords.reduce((count, word) =>
        count + (windowText.toLowerCase().split(word).length - 1), 0);

      if (wordCount > maxKeywordCount) {
        maxKeywordCount = wordCount;
        bestSubstring = windowText;
      }
    }

    let snippet = bestSubstring || text.substring(0, maxLength);
    let regex = new RegExp(`\\b(${queryWords.join('|')})\\b`, 'gi');
    let highlightedText = snippet.replace(regex, match => `<span class="dashboard__search-highlight">${match}</span>`);

    return this.sanitizer.bypassSecurityTrustHtml(highlightedText);
  }
}
