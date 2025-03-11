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

  constructor(
    public dashboardService: DashboardService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];
    this.route.queryParams.subscribe(params => {
      this.queryParams = params;
    });
  }

  ngAfterViewInit() {
  setTimeout(() => this.scrollToSavedItem(), 100); // Small delay
}

  saveSession(itemId: string) {
    if (itemId) {
      sessionStorage.setItem('selectedItem', itemId);
    }
  }

  scrollToSavedItem() {
    const savedItemId = sessionStorage.getItem('selectedItem');
    console.log("Retrieved ID from sessionStorage:", savedItemId); // Debugging log
    if (savedItemId) {
      setTimeout(() => {
        const element = document.getElementById('item-' + savedItemId);
        console.log("Scrolling to:", element); // Debugging log
        if (element) {
          element.scrollIntoView({behavior: 'smooth', block: 'start'});
        } else {
          console.warn("Element not found for ID:", 'item-' + savedItemId);
        }
      }, 500);
    } else {
      console.warn("No saved ID in sessionStorage.");
    }
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
