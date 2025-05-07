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

  highlightWords(text: string): SafeHtml {
    if (!text) return '';

    let highlighted: string;

    if (text.includes('<em>') && text.includes('</em>')) {
      highlighted = text
        .replace(/<em>/g, '<span class="dashboard__search-highlight">')
        .replace(/<\/em>/g, '</span>');
    } else {
      highlighted = text.length > 500 ? text.substring(0, 300) : text;
    }

    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }


  private escapeHtml(text: string): string {
    let tempDiv = document.createElement("div");
    tempDiv.textContent = text;
    return tempDiv.innerHTML;
  }
}
