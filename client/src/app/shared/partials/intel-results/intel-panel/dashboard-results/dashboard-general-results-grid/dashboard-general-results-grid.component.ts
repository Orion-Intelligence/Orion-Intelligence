import {Component, Input, AfterViewInit} from '@angular/core';
import {NgForOf} from '@angular/common';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {DashboardService} from '../../../../../../services/dashboard/dashboard.service';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';

@Component({
  selector: 'app-dashboard-general-results-grid',
  templateUrl: './dashboard-general-results-grid.component.html',
  imports: [NgForOf, RouterLink]
})
export class DashboardGeneralResultsGridComponent implements AfterViewInit {
  @Input() query!: string;
  currentUrl: string = '';
  queryParams: any = {};

  constructor(public dashboardService: DashboardService, private sanitizer: DomSanitizer, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];
    this.route.queryParams.subscribe(params => {
      this.queryParams = params;
    });
  }

  ngAfterViewInit() {
    this.scrollToSavedItem();
  }

  saveSession(itemId: string) {
    if (itemId) {
      sessionStorage.setItem('selectedItem', itemId);
    }
  }

  scrollToSavedItem() {
    const savedItemId = sessionStorage.getItem('selectedItem');
    if (savedItemId) {
      const element = document.getElementById('item-' + savedItemId);
      if (element) {
        element.scrollIntoView();
      }
    }
  }


  highlightWords(text: string, maxLength: number = 250): SafeHtml {
    if (!this.query || text.length <= maxLength) {
      let truncatedText = text.substring(0, maxLength);
      if (text.length > maxLength) {
        const lastSpaceIndex = truncatedText.lastIndexOf(' ');
        if (lastSpaceIndex > 0) {
          truncatedText = truncatedText.substring(0, lastSpaceIndex);
        }
        truncatedText += '...';
      }
      return this.sanitizer.bypassSecurityTrustHtml(this.escapeHtml(truncatedText));
    }

    const queryWords = this.query
      .split(/\s+/)
      .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase());
    const effectiveMaxLength = maxLength - 3;

    let bestSubstring = '';
    let maxKeywordCount = 0;
    let bestStartIndex = 0;

    for (let i = 0; i <= text.length - effectiveMaxLength; i++) {
      const windowText = text.slice(i, i + effectiveMaxLength);
      const wordCount = queryWords.reduce((count, word) => count + (windowText.toLowerCase().split(word).length - 1), 0);

      if (wordCount > maxKeywordCount) {
        maxKeywordCount = wordCount;
        bestSubstring = windowText;
        bestStartIndex = i;
      }
    }

    if (!bestSubstring) {
      bestSubstring = text.substring(0, effectiveMaxLength);
      bestStartIndex = 0;
    }

    if (bestStartIndex > 0) {
      let adjustedStart = text.lastIndexOf('. ', bestStartIndex - 1);
      if (adjustedStart === -1 || adjustedStart < bestStartIndex - effectiveMaxLength) {
        adjustedStart = text.lastIndexOf(' ', bestStartIndex - 1);
      }
      if (adjustedStart !== -1 && adjustedStart >= 0) {
        bestSubstring = text.slice(adjustedStart + 1, adjustedStart + 1 + effectiveMaxLength);
      }
    }

    const lastSpaceIndex = bestSubstring.lastIndexOf(' ');
    if (lastSpaceIndex > 0 && bestSubstring.length === effectiveMaxLength) {
      bestSubstring = bestSubstring.substring(0, lastSpaceIndex);
    }

    const regex = new RegExp(`\\b(${queryWords.join('|')})\\b`, 'gi');
    let escapedSnippet = this.escapeHtml(bestSubstring);
    let highlightedText = escapedSnippet.replace(regex, match => `<span class="dashboard__search-highlight">${match}</span>`);

    highlightedText += '...';
    return this.sanitizer.bypassSecurityTrustHtml(highlightedText);
  }

  escapeHtml(text: string): string {
    let tempDiv = document.createElement("div");
    tempDiv.textContent = text;
    return tempDiv.innerHTML;
  }
}
