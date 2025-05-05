import {Injectable} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  constructor(private sanitizer: DomSanitizer, private router: Router, private activatedRoute: ActivatedRoute) {
  }

  downloadAsCSV(data: any) {
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'search_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private convertToCSV(data: any): string {
    const keys = Object.keys(data);
    const values = keys.map(key => `"${data[key]}"`).join(',');
    return `${keys.join(',')}\n${values}`;
  }

  printPage() {
    window.print();
  }

  shareResult(url: string) {
    if (navigator.share) {
      navigator.share({
        title: 'Orion Intelligence', text: 'Sharing a relevant CTI resource for review.', url: url
      }).catch(error => console.error('Error sharing:', error));
    } else {
      alert('Sharing is not supported on this browser.');
    }
  }

  reset_query_param(): void {
    this.router.navigate([], {
      queryParams: {},
      replaceUrl: true
    }).then();
  }

  highlightWords(text: string, query: string, maxLength: number = 250): SafeHtml {
    if (!query || text.length <= maxLength) {
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

    const queryWords = query
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

  private escapeHtml(text: string): string {
    let tempDiv = document.createElement("div");
    tempDiv.textContent = text;
    return tempDiv.innerHTML;
  }
}
